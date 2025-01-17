"use strict";

class tableImportComponent extends uiComponent {
   constructor({
      node,
      insert = "append",
      insertClass,
      label,
      labelId,
      labelConcept,
      value,
      icon,
      placeholder,
      placeholderId, //Wording ID
      placeholderConcept, //Wording concept
      explanationLabel,
      explanationLabelId,
      explanationLabelConcept,
      explanationText,
      explanationTextId,
      explanationTextConcept,
      parent,
      focusOnRender,
      validation = {},
      wordingModule,
      externalListeners,
      dataStructure,
      requireHeaderRow,
   }) {
      super({ node, insert, insertClass, parent, externalListeners });
      if (!node && insert != "modal") return;

      this.dataStructure = dataStructure;
      this.requireHeaderRow = requireHeaderRow;

      this.label = label;
      this.labelId = labelId;
      this.labelConcept = labelConcept;
      this.icon = icon;
      this.value = value;
      this.placeholder = placeholder;
      this.placeholderId = placeholderId;
      this.placeholderConcept = placeholderConcept;
      this.explanationLabel = explanationLabel;
      this.explanationLabelId = explanationLabelId;
      this.explanationLabelConcept = explanationLabelConcept;
      this.explanationText = explanationText;
      this.explanationTextId = explanationTextId;
      this.explanationTextConcept = explanationTextConcept;
      this.focusOnRender = focusOnRender;
      this.validation = validation;

      this.wordingModule = wordingModule || this.getAncestorProperty({ property: "wordingModule" });
      this.render({});

      // Register listeners
      this.registerListeners({
         className: "table-import-action",
         listeners: [
            { function: this.processData, events: ["click", "enter"] },
            { function: this.submitData, events: ["click", "enter"] },
         ],
      });
   }

   render({}) {
      let markup = `
        <div class="table-import-stages">
            <div class="table-import-stage active">Input data</div>
            <div class="table-import-stage">Review</div>
        </div>

        <div class="table-import-panels">
            <div class="table-import-panel" data-key="input">
                <div class="form-element input-text ${this.icon ? "" : "no-icon"}">`;

      let label = this.getWording({
         id: this.labelId,
         concept: this.labelConcept,
         text: this.label,
      });

      if (label) {
         markup += `<label>${label}</label>`;
      }

      let explanationLabel = this.getWording({
         id: this.explanationlabelId,
         concept: this.explanationlabelConcept,
         text: this.explanationlabel,
      });

      if (explanationLabel) {
         markup += `
        <button class="icon-help-circled explanation-toggle link text-input-action" data-action="toggleExplanation">${explanationLabel}</button>
        <div class="explanation-text hide">${this.explanationText}</div>`;
      }

      markup += `
               <div class="form-element-invalid-message"></div> 
               <div class="form-element-input-container">`;

      if (this.icon) {
         markup += `<div class="form-element-icon icon-${this.icon}"></div>`;
      }

      let placeholder = this.getWording({
         id: this.placeholderId,
         concept: this.placeholderConcept,
         text: this.placeholder,
      });

      markup += `
                <div class="form-element-textarea-container">
                    <textarea placeholder="${placeholder}"></textarea>
                </div>  

                <button class="pill green icon-upload table-import-action" data-action="processData">Import</button>
            </div>
         </div>`;

      markup += `
            </div>

            
            <div class="table-import-panel" data-key="review"></div> 
        </div>

        

            `;

      this.node.innerHTML = markup;

      if (this.focusOnRender) {
         this.getNode("textarea").focus();
         this.getNode("textarea").selectionStart = this.getNode("textarea").value.length;
      }
   }

   getValue() {
      return this.value;
   }

   processData({}) {
      let inputValue = this.getNode("textarea").value;

      //Convert to JSON
      let data = this.convertExcelToJson({ data: inputValue });

      if (!data.length) {
         return alert("No spreadsheet data recognized. Please try copying and pasting your data again");
      }

      //Do column identification
      const columnOutcome = this.identifyColumns({ data, dataStructure: this.dataStructure });

      //Show failures
      if (columnOutcome.failures.length) {
         return this.showFailures({ failures });
      }

      //Where reviews, allow user to do own mappings (e.g. choosing columns)
      //To do...

      //Parse data
      const dataOutcome = this.parseData({
         data,
         columnMappings: columnOutcome.columnMappings,
         dataStructure: this.dataStructure,
      });

      //Show failures
      if (dataOutcome.failures.length) {
         return this.showFailures({ failures });
      }

      //Where reviews, allow user to edit values in tabular format
      //To do...

      console.log(dataOutcome);
      this.data = dataOutcome;

      this.renderPreview({ data: dataOutcome.data, dataStructure: this.dataStructure });
   }

   setValue({ value }) {
      this.getNode("input").value = value;
   }

   validate({ updateUI, scrollTo }) {
      const value = this.getValue();

      if (this.validation.required && !value && value !== 0) {
         let message = this.getWording({
            concept: "required",
            text: "Required",
         });

         if (updateUI) this.showInvalid({ message, scrollTo });
         return { valid: false, message };
      }

      if (this.validation.minLength && value && value.length < this.validation.minLength) {
         let message = this.getWording({
            concept: "too_short",
            text: "Too short",
         });
         if (updateUI) this.showInvalid({ message, scrollTo });
         return { valid: false, message };
      }

      if (this.validation.maxLength && value && value.length > this.validation.maxLength) {
         let message = this.getWording({
            concept: "too_long",
            text: "Too long",
         });
         if (updateUI) this.showInvalid({ message, scrollTo });
         return { valid: false, message };
      }

      if (updateUI) this.clearInvalid({});
      return { valid: true };
   }

   showInvalid({ message, scrollTo }) {
      this.node.classList.add("invalid");
      this.invalid = true;
      this.getNode(".form-element-invalid-message").innerHTML = message;

      if (scrollTo) {
         this.scrollTo({});
      }
   }

   clearInvalid({}) {
      this.node.classList.remove("invalid");
      this.invalid = false;
   }

   inputChange({}) {
      if (this.externalListeners) {
         this.fireExternalListenerEvents({ eventTypes: "change", data: this.getValue() });
      }
   }

   convertExcelToJson({ data }) {
      const rows = data.trim().split("\n");
      const jsonArray = [];

      // Assuming the first row contains headers
      let headers = [];
      if (this.requireHeaderRow) {
         headers = rows[0].split("\t");
      } else {
         const colCount = rows[0].split("\t");
         for (let i = 0; i < colCount.length; i++) {
            headers.push(`col_${colCount[i]}`);
         }
      }

      for (let i = 1; i < rows.length; i++) {
         const rowData = rows[i].split("\t");
         const obj = {};
         headers.forEach((header, index) => {
            obj[header] = rowData[index];
         });
         jsonArray.push(obj);
      }

      return jsonArray;
   }

   identifyColumns({ data, dataStructure }) {
      //Try header name identification
      let failures = [];
      let reviews = [];
      let matchedColumns = [];

      const columnMappings = {};

      for (let i in dataStructure) {
         const column = dataStructure[i];
         const matchedCol = this.getMatchedCol({ column, testRow: data[0] });

         //Validate result
         if (matchedColumns.includes(matchedCol)) {
            failures.push({
               type: "duplicate_column_name",
               value: matchedCol,
            });
         }

         if (!matchedCol) {
            if (column.identificationFailureHandling == "fail") {
               failures.push({
                  type: "missing_column",
                  value: column.key,
               });
            }

            if (column.identificationFailureHandling == "review") {
               reviews.push({
                  type: "missing_column",
                  value: column.key,
               });
            }
         }

         //Add to mappings
         if (matchedCol) {
            columnMappings[matchedCol] = column.key;
         }
      }

      return {
         columnMappings,
         reviews,
         failures,
      };
   }

   getMatchedCol({ column, testRow }) {
      let i = 0;
      for (const key in testRow) {
         i++;
         //Column name
         if (column.identifiers && column.identifiers.includes(key)) {
            return key;
         }

         if (column.identificationOrder == i) {
            return key;
         }
      }
   }

   parseData({ data, columnMappings, dataStructure }) {
      const parsedRows = [];
      const failures = [];
      const reviews = [];

      for (var i = 0, length = data.length; i < length; i++) {
         const row = data[i];

         const parsedRow = {};
         let skipRow;

         for (const key in row) {
            const columnKey = columnMappings[key];
            if (!columnKey) continue;

            const columnConfig = dataStructure.find((c) => c.key == columnKey);
            let value = row[key].trim();

            //Do parse functions
            //To do...

            //Do validation
            let validationError = null;
            if (columnConfig.required && !value) {
               validationError = "required";
               continue;
            }

            if (columnConfig.validationRegex && !value.match(columnConfig.validationRegex)) {
               validationError = "invalid";
               continue;
            }

            if (validationError) {
               if (columnConfig.failureHandling == "fail") {
                  failures.push({
                     row: i,
                     column: columnKey,
                     type: validationError,
                  });
               }

               if (columnConfig.failureHandling == "review") {
                  reviews.push({
                     row: i,
                     column: columnKey,
                     type: validationError,
                  });
               }

               if (columnConfig.failureHandling == "ignoreValue") {
                  value = null;
               }

               if (columnConfig.failureHandling == "ignoreRow") {
                  skipRow = true;
               }
            }

            parsedRow[columnKey] = value;
         }

         //Add to parsed rows
         if (!skipRow) {
            parsedRows.push(parsedRow);
         }
      }

      return {
         data: parsedRows,
         failures,
         reviews,
      };
   }

   renderPreview({ data, dataStructure }) {
      let markup = `
      <table>
         <tr>
      `;

      for (let i = 0; i < dataStructure.length; i++) {
         const column = dataStructure[i];
         markup += `<th>${column.key}</th>`;
      }

      markup += "</tr>";

      for (let i = 0; i < data.length; i++) {
         const row = data[i];
         markup += `<tr>`;

         for (let i = 0; i < dataStructure.length; i++) {
            const column = dataStructure[i];
            markup += `<td>${row[column.key]}</td>`;
         }

         markup += `</tr>`;
      }

      markup += `</table>
      <button class="pill green icon-ok table-import-action" data-action="submitData">Import</button>
      `;

      const inputPanel = this.getNode('.table-import-panel[data-key="input"]');
      this.hide({ node: inputPanel });
      const reviewPanel = this.getNode('.table-import-panel[data-key="review"]');
      reviewPanel.innerHTML = markup;
      this.show({ node: reviewPanel });
   }

   submitData({}) {
      this.fireExternalListenerEvents({ eventTypes: "submit", data: this.data.data });
   }

   showLoading({}) {
      this.addSpinner({ node: this.node, overlay: true });
   }
}
