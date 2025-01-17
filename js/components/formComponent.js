"use strict";

class formComponent extends uiComponent {
   constructor({
      node,
      insert = "append",
      insertClass,
      title,
      sections,
      fields,
      edit,
      submitLabel,
      cancelButton,
      buttons,
      submitFunction,
      parentData,
      externalListeners,
      parent,
   }) {
      super({ node, insert, insertClass, externalListeners, parent });
      this.parent = parent;
      this.title = title;
      this.sections = sections;
      this.fields = fields;
      this.fieldElements = {};
      this.buttons = buttons;
      this.edit = edit;
      this.getInitData();
      this.submitLabel = submitLabel;
      this.cancelButton = cancelButton;
      this.submitFunction = submitFunction;
      this.parentData = parentData;
      this.render({});

      // Register listeners
      this.registerListeners({
         className: "form-action",
         listeners: [
            { function: this.cancel, events: ["click", "enter"] },
            { function: this.submit, events: ["click", "enter"] },
            { function: this.buttonSelect, events: ["click", "enter"] },
            { function: this.valueChange, events: ["childEvent"], stopPropagation: true },
            { function: this.removeImage, events: ["childEvent"] },
         ],
      });
   }

   async render({}) {
      let markup = ``;
      //Render title
      if (this.title) {
         markup += `<h1>${this.title}</h1>`;
      }

      this.addSpinner({ overlay: true });
      await this.wait(1000);
      this.removeSpinner({ overlay: true });

      //Build sections
      if (this.sections) {
         for (let i = 0; i < this.sections.length; i++) {
            const section = this.sections[i];
            markup += `
            <div class="form-section ${section.class || ""}" data-key="${section.key}">
            `;
            if (section.title) {
               markup += `<h2>${section.title}</h2>`;
            }

            markup += `
            <div class="form-footer">`;
            if (section.buttons) {
               markup += this.renderButtons({ buttons: section.buttons });
            }
            markup += `
            </div>`;
         }
      }

      //Footer
      if (!this.sections) {
         markup += `<div class="form-section"></div>`;
         markup += ` 
         <div class="form-footer">`;
         markup += this.renderButtons({ buttons: this.buttons });
         markup += ` 
            </div>
            `;
      }

      this.node.innerHTML = markup;

      for (let i = 0; i < this.fields.length; i++) {
         const field = this.fields[i];

         if (field.hidden) {
            this.fieldElements[field.key] = {
               getValue: () => {
                  return field.value;
               },
            };
            continue;
         }

         let targetNode = this.node;
         if (field.section) {
            targetNode = this.node.querySelector(`.form-section[data-key="${field.section}"]`);
         } else {
            targetNode = this.node.querySelector(`.form-section`);
         }

         if (field.style == "question") {
            this.insertMarkup({
               node: targetNode,
               markup: `
            <div class="step-question" data-key="${field.key}">
                ${field.questionIcon ? `<div class="step-question-icon icon-${field.questionIcon}"></div>` : ""}
                <div class="step-question-text fade-in-up"></div> 
                ${
                   field.questionSubText
                      ? `<div class="step-question-sub-text fade-in-up delay-1">${field.questionSubText}</div>`
                      : ""
                }
                <div class="step-question-response fade-in delay-1-5"></div>
            </div>`,
            });

            this.animateText({ text: field.questionText, node: targetNode.querySelector(".step-question-text") });

            targetNode = targetNode.querySelector(`.step-question[data-key="${field.key}"] .step-question-response`);
         }

         //Test show conditions
         let hide = field.hide;
         if (field.showConditions && field.showConditions.length) {
            if (!this.testShowConditions({ conditions: field.showConditions })) {
               hide = true;
               field.hide = true;
            }
         }

         if (field.type == "text" || field.type == "number") {
            this.fieldElements[field.key] = new textInputComponent({
               node: targetNode,
               insert: "append",
               label: field.label,
               addButtonDependency: field.addButtonDependency,
               icon: field.icon,
               placeholder: field.placeholder,
               number: field.type == "number",
               value: field.value,
               hide,
               key: field.key,
               externalListeners: [
                  {
                     type: "valueChange",
                     action: "valueChange",
                  },
               ],
               parent: this,
            });
         }

         if (field.type == "textarea") {
            this.fieldElements[field.key] = new textInputComponent({
               node: targetNode,
               insert: "append",
               textarea: true,
               disableToolbar: field.disableToolbar,
               label: field.label,
               icon: field.icon,
               placeholder: field.placeholder,
               value: field.value,
               hide,
               key: field.key,
               externalListeners: [
                  {
                     type: "valueChange",
                     action: "valueChange",
                  },
               ],
               parent: this,
            });
         }

         if (field.type == "select") {
            let selectMarkup = ` 
            <div class="form-element ${hide ? "hide" : ""}" key="${field.key}">
             ${field.label ? `<label>${field.label}</label>` : ``}
            <div class="form-element-invalid-message"></div>
            <div class="form-element-input-container"></div>
         </div>`;

            targetNode.insertAdjacentHTML("beforeend", selectMarkup);

            this.fieldElements[field.key] = new selectComponent({
               node: targetNode.querySelector(`.form-element[key="${field.key}"] .form-element-input-container`),
               insert: "append",
               icon: field.icon,
               type: "picker",
               definitionOptions: field.options,
               multiSelect: field.multiSelect,
               placeholder: field.placeholder,
               value: field.value,
               parent: this,
               searchEnabled: field.searchEnabled,
               browseEnabled: field.browseEnabled,
               browseTreeEnabled: field.browseTreeEnabled,
               folderSelectEnabled: field.folderSelectEnabled,
               indexFunction: field.indexFunction,
               resultDisplayFunction: field.resultDisplayFunction,
               lookupDisplayFunction: field.lookupDisplayFunction,
               externalListeners: [
                  {
                     type: "select",
                     action: "valueChange",
                  },
                  {
                     type: "deselect",
                     action: "valueChange",
                  },
               ],
               parent: this,
            });
         }

         if (field.type == "icon") {
            this.fieldElements[field.key] = new iconSelectComponent({
               node: targetNode,
               insert: "append",
               label: field.label,
               value: field.value,
               hide,
               key: field.key,
               externalListeners: [
                  {
                     type: "select",
                     action: "valueChange",
                  },
               ],
               parent: this,
            });
         }

         if (field.type == "imageUpload") {
            const listeners = field.externalListeners || [];
            listeners.push({
               type: "upload",
               action: "valueChange",
            });

            this.fieldElements[field.key] = new imageUploadComponent({
               node: targetNode,
               insert: "append",
               label: field.label,
               addButton: field.addButton,
               addButtonChild: field.addButtonChild,
               value: field.value,
               hide,
               key: field.key,
               externalListeners: listeners,
               parent: this,
            });
         }

         if (field.type == "fileUpload") {
            const listeners = field.externalListeners || [];
            listeners.push({
               type: "upload",
               action: "valueChange",
            });

            this.fieldElements[field.key] = new fileUploadComponent({
               node: targetNode,
               insert: "append",
               label: field.label,
               addButton: field.addButton,
               value: field.value,
               hide,
               key: field.key,
               externalListeners: listeners,
               parent: this,
            });
         }
      }
   }

   renderButtons({ buttons }) {
      let markup = ``;
      if (!buttons) return markup;

      for (let i = 0; i < buttons.length; i++) {
         const button = buttons[i];

         let action = button.action;
         let actionName = ``;
         if (!["cancel", "submit"].includes(action)) {
            action = "buttonSelect";
            actionName = `data-action-name="${button.action}"`;
         }

         markup += `
         <button class="form-action ${button.class || ""}" data-action="${action}" ${actionName}>${
            button.label
         }</button>`;
      }

      return markup;
   }

   cancel({}) {
      //If pass...
      if (this.externalListeners) {
         this.fireExternalListenerEvents({ eventTypes: "cancel" });
      }
   }

   submit({}) {
      //Get data
      const data = this.getData();

      //Validate
      const valid = this.validate({ scrollTo: true });
      if (!valid) return;

      //If pass...
      if (this.externalListeners) {
         this.fireExternalListenerEvents({ eventTypes: "submit", data });
      }

      if (this.submitFunction) {
         this.submitFunction({ data });
      }
   }

   getData() {
      const data = {};

      //Get stored hidden values
      for (let i = 0; i < this.fields.length; i++) {
         const field = this.fields[i];
         if (field.type == "hidden") data[field.key] = field.value;
      }

      //Get from field elements
      for (const key in this.fieldElements) {
         if (this.fields.find((i) => i.key == key).hide) continue;
         data[key] = this.fieldElements[key].getValue();
      }

      this.data = data;
      return data;
   }

   getInitData() {
      const data = {};
      for (let i = 0; i < this.fields.length; i++) {
         const field = this.fields[i];

         //New objects: get from default value
         if (!this.edit) {
            data[field.key] = field.default;
         }

         //Existing objects: get from value field
         if (this.edit) {
            data[field.key] = field.value;
         }
      }

      this.data = data;
   }

   testShowConditions({ conditions }) {
      for (let i = 0; i < conditions.length; i++) {
         const condition = conditions[i];
         let source = this.data;

         //Get other sources...
         if (condition.source) {
            //
         }

         const sourceValue = source[condition.key];

         if (Array.isArray(condition.value)) {
            return condition.value.includes(sourceValue);
         } else {
            return condition.value == sourceValue;
         }
      }
   }

   valueChange({}) {
      console.log("value change");

      //Update data
      this.data = this.getData();

      let validationErrorsExist = false;

      //Update visibility status
      for (let i = 0; i < this.fields.length; i++) {
         const field = this.fields[i];

         if (field.hidden) continue;

         if (field.showConditions && field.showConditions.length) {
            const status = this.testShowConditions({ conditions: field.showConditions });
            if (!status && !field.hide) {
               field.hide = true;
               this.node.querySelector(`.form-element[data-key="${field.key}"]`).classList.add("hide");
            } else if (status && field.hide) {
               field.hide = false;
               this.node.querySelector(`.form-element[data-key="${field.key}"]`).classList.remove("hide");
            }
         }

         if (!field.invalid) {
            validationErrorsExist = true;
         }
      }

      if (validationErrorsExist) {
         this.validate({});
      }
   }

   validate({ scrollTo }) {
      let valid = true;

      for (let i = 0; i < this.fields.length; i++) {
         const field = this.fields[i];
         if (field.hidden) continue;
         if (field.hide) continue;
         scrollTo = scrollTo && valid == true;

         //Do required check
         if (field.required && !this.data[field.key] && this.data[field.key] !== 0) {
            valid = false;
            this.fieldElements[field.key].showInvalid({ message: "Required", scrollTo });
            continue;
         }

         //Do custom validation
         if (field.validation) {
            const validationResult = field.validation({
               value: this.data[field.key],
               data: this.data,
               parentData: this.parentData,
            });

            if (!validationResult.valid) {
               valid = false;
               this.fieldElements[field.key].showInvalid({ message: validationResult.message, scrollTo });
               continue;
            }
         }

         if (this.fieldElements[field.key]) {
            this.fieldElements[field.key].clearInvalid({});
         }
      }

      return valid;
   }

   buttonSelect({ actionName }) {
      if (this.externalListeners) {
         this.fireExternalListenerEvents({ eventTypes: actionName });
      }
   }

   removeImage({}) {
      if (this.externalListeners) {
         this.fireExternalListenerEvents({ eventTypes: ["removeImage"] });
      }
   }

   animateText({ text, node, currentIndex = 0 }) {
      if (currentIndex < text.length) {
         // Add the next character to the typed text
         node.textContent += text[currentIndex];
         currentIndex++;
         if (currentIndex < text.length) {
            setTimeout(this.animateText.bind(this, { text, node, currentIndex }), 25);
         }
      }
   }
}
