"use strict";

class textInputComponent extends uiComponent {
   constructor({
      node,
      insert = "append",
      insertClass,
      number,
      decimalPlaces = 0,
      negative,
      textarea,
      plainText,
      password,
      allowPasswordView,
      multiSelect,
      multiSelectDelimiter = ",",
      multiSelectArrayChar,
      disableToolbar,
      sanitize,
      label,
      labelId,
      labelConcept,
      length,
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
      inlineSubmit,
      submitSpinner,
      hide,
      key,
      parent,
      focusOnRender,
      validation = {},
      languageId,
      audience,
      wordingModule,
      externalListeners,
   }) {
      super({ node, insert, insertClass, parent, externalListeners });
      if (!node && insert != "modal") return;

      this.textarea = textarea;
      this.plainText = plainText;
      this.number = number;
      this.decimalPlaces = decimalPlaces;
      this.negative = negative;
      this.password = password;
      this.allowPasswordView = allowPasswordView;
      this.label = label;
      this.labelId = labelId;
      this.labelConcept = labelConcept;
      this.icon = icon;
      this.length = length;
      this.value = value;
      this.placeholder = placeholder;
      this.placeholderId = placeholderId;
      this.placeholderConcept = placeholderConcept;
      this.key = key;
      this.hide = hide;
      this.invalid = false;
      this.quill = null;
      this.disableToolbar = disableToolbar;
      this.sanitize = sanitize;
      this.explanationLabel = explanationLabel;
      this.explanationLabelId = explanationLabelId;
      this.explanationLabelConcept = explanationLabelConcept;
      this.explanationText = explanationText;
      this.explanationTextId = explanationTextId;
      this.explanationTextConcept = explanationTextConcept;
      this.focusOnRender = focusOnRender;
      this.validation = validation;
      this.inlineSubmit = inlineSubmit;
      this.submitSpinner = submitSpinner;

      this.multiSelect = multiSelect;
      this.multiSelectDelimiter = multiSelectDelimiter;
      this.multiSelectArrayChar = multiSelectArrayChar;
      this.multiSelectValues = this.multiSelect ? this.parseMultiSelectValues({ value }) : [];

      this.wordingModule = wordingModule || this.getAncestorProperty({ property: "wordingModule" });
      this.languageId = languageId || this.getAncestorProperty({ property: "languageId" });
      this.audience = audience || this.getAncestorProperty({ property: "audience" });

      this.render({});

      // Register listeners
      this.registerListeners({
         className: "text-input-action",
         listeners: [
            { function: this.toggleExplanation, events: ["click", "enter"] },
            { function: this.inputChange, events: ["input"] },
            { function: this.valueAdd, events: ["click", "enter"] },
            { function: this.valueRemove, events: ["click", "enter"] },
            { function: this.passwordViewToggle, events: ["click", "enter"] },
            { function: this.submit, events: ["click", "enter"] },
         ],
      });
   }

   render({}) {
      let markup = `
            <div class="form-element input-text ${this.icon ? "" : "no-icon"} ${this.hide ? "hide" : ""}" data-key="${
         this.key
      }">`;

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
               <div class="form-element-invalid-message"></div>`;

      if (this.multiSelect) {
         markup += ` 
         <div class="text-input-action-selection-panel ${this.value ? `` : `hide`}">
            ${this.renderMultiSelect({})}
         </div>`;
      }

      markup += `
               <div class="form-element-input-container">`;

      if (this.icon) {
         markup += `<div class="form-element-icon icon-${this.icon}"></div>`;
      }

      //Ensure zero values get set
      if (this.number && this.value === 0) this.value = "0";

      let placeholder = this.getWording({
         id: this.placeholderId,
         concept: this.placeholderConcept,
         text: this.placeholder,
      });

      if (!this.textarea) {
         markup += `
               <input type="${this.password ? "password" : "text"}" placeholder="${placeholder}" value="${
            this.multiSelect ? "" : this.value || ``
         }" class="text-input-action ${this.icon ? "has-icon" : ""}" data-action="inputChange" ${
            this.length ? `maxlength="${this.length}" size="${this.length}"` : ``
         }>
            `;
         if (this.multiSelect) {
            markup += `<button class="text-input-add icon-plus text-input-action" data-action="valueAdd"></button>`;
         }

         if (this.allowPasswordView) {
            markup += `<button class="text-input-password-view text-input-action" data-action="passwordViewToggle"></button>`;
         }
      }

      if (this.textarea) {
         markup += `
         <div class="form-element-textarea-container">
            <div id="text-area-${this.componentId}" class="${
            !this.disableToolbar ? "" : "disableToolbar"
         }" placeholder="${placeholder}">${this.value || ``}</div>
         </div>
            `;
      }

      if (this.inlineSubmit) {
         markup += `<button class="inline-submit text-input-action icon-ok" data-action="submit"></button>`;
      }

      markup += `</div> 
         </div>`;

      this.node.innerHTML = markup;

      if (!this.textarea && this.focusOnRender) {
         this.getNode("input").focus();
         this.getNode("input").selectionStart = this.getNode("input").value.length;
      }

      if (this.textarea) {
         this.quill = new Quill(`#text-area-${this.componentId}`, {
            theme: "snow",
            placeholder: this.placeholder,
            modules: {
               toolbar: !this.disableToolbar,
               clipboard: {
                  matchers: [
                     [
                        "h1",
                        function (node, delta) {
                           return delta; // Allow H1 tags
                        },
                     ],
                     [
                        "h2",
                        function (node, delta) {
                           return delta; // Allow H2 tags
                        },
                     ],
                     [
                        "h3",
                        function (node, delta) {
                           return delta; // Allow H3 tags
                        },
                     ],
                     [
                        "a",
                        function (node, delta) {
                           // Allow 'href' attribute for A tags
                           if (node.attrs && node.attrs.href) {
                              return delta.compose();
                           }
                           return delta;
                        },
                     ],
                     [
                        "ul",
                        function (node, delta) {
                           return delta; // Allow unordered lists
                        },
                     ],
                     [
                        "ol",
                        function (node, delta) {
                           return delta; // Allow ordered lists
                        },
                     ],
                     [
                        "li",
                        function (node, delta) {
                           return delta; // Allow list items
                        },
                     ],
                     [
                        "table",
                        function (node, delta) {
                           return delta; // Allow tables
                        },
                     ],
                     [
                        "tr",
                        function (node, delta) {
                           return delta; // Allow table rows
                        },
                     ],
                     [
                        "td",
                        function (node, delta) {
                           return delta; // Allow table cells
                        },
                     ],
                     [
                        "p",
                        function (node, delta) {
                           return delta; // Allow paragraphs
                        },
                     ],
                     [
                        "br",
                        function (node, delta) {
                           return delta; // Allow line breaks
                        },
                     ],
                  ],
               },
            },
            sanitize: this.sanitize, //Prevent encoding of punctuation as html entities (lowers security)
         });

         if (this.focusOnRender) {
            const length = this.quill.getLength();
            this.quill.setSelection(length, length);
         }
      }
   }

   parseMultiSelectValues({ value }) {
      if (!value) return [];
      if (Array.isArray(value)) {
         this.multiSelectValues = value;
         return value;
      }

      value = value.toString();

      if (this.multiSelectArrayChar) {
         //Remove first char
         if (value.startsWith(this.multiSelectArrayChar[0])) {
            value = value.substring(1);
         }
         //Remove last char
         if (value.endsWith(this.multiSelectArrayChar[1])) {
            value = value.substring(0, value.length - 1);
         }
      }

      return value.split(this.multiSelectDelimiter);
   }

   encodeMultiSelect({}) {
      let text = this.multiSelectValues;
      if (this.multiSelectDelimiter) {
         text = this.multiSelectValues.join(this.multiSelectDelimiter);
         if (!text) return null;
         if (this.multiSelectArrayChar) {
            text = this.multiSelectArrayChar[0] + text + this.multiSelectArrayChar[1];
         }
      }
      return text;
   }

   renderMultiSelect({}) {
      let markup = "";
      if (this.multiSelectValues.length) {
         for (let i = 0; i < this.multiSelectValues.length; i++) {
            const item = this.multiSelectValues[i];

            markup += `
         <div class="select-component-selection-panel-item">
            ${item}
            <button class="select-component-item-deselect text-input-action" data-action="valueRemove" data-key="${item}"></button>
         </div>
      `;
         }
      }

      return markup;
   }

   valueAdd({}) {
      let text = this.getNode("input").value.trim();
      this.addText({ text });

      let markup = this.renderMultiSelect({});

      const selectionPanel = this.getNode(".text-input-action-selection-panel");
      selectionPanel.innerHTML = markup;
      selectionPanel.classList.remove("hide");

      this.getNode("input").value = "";
   }

   addText({ text }) {
      if (this.multiSelectDelimiter) text = text.replace(new RegExp(this.multiSelectDelimiter, "g"), "");
      if (!text) return;
      this.multiSelectValues.push(text);
   }

   valueRemove({ key }) {
      this.multiSelectValues = this.multiSelectValues.filter((item) => item != key);
      let markup = this.renderMultiSelect({});
      this.getNode(".text-input-action-selection-panel").innerHTML = markup;
   }

   getValue() {
      let text = null;
      if (this.textarea) {
         const contents = this.quill.getContents(); // Get the Quill contents
         const tempQuill = new Quill(document.createElement("div")); // Create a temporary Quill instance
         tempQuill.setContents(contents);
         const htmlContent = tempQuill.root.innerHTML;

         //If only tags, return empty string
         if (htmlContent.replace(/(<p>|<br>|<\/p>|&nbsp;)/g, "").length == 0) return "";

         text = htmlContent;

         if (this.plainText) {
            //Replace </p> tags with \n
            text = text.replace(/<\/p>/gi, "\n");
            //Remove all other tags
            text = text.replace(/(<([^>]+)>)/gi, "");

            //Remove common special characters (e.g &nbsp;)
            const htmlEntities = {
               "&nbsp;": "",
               "&amp;": "&",
               "&lt;": "<",
               "&gt;": ">",
               "&quot;": '"',
               "&apos;": "'",
            };
            for (const key in htmlEntities) {
               const replacement = htmlEntities[key];
               text = text.replace(new RegExp(key, "gi"), replacement);
            }
         }
      }

      if (!this.textarea) {
         text = this.getNode("input").value.trim();

         if (this.multiSelect) {
            this.addText({ text });
            text = this.encodeMultiSelect({});
         }
      }

      if (this.number) {
         if (text == "") return null;
         text = parseFloat(text);

         if (this.multiSelect) {
            text = this.encodeMultiSelect({ text });
         }
         return text;
      }

      return text;
   }

   setValue({ value }) {
      if (this.textarea) {
         this.getNode(`.ql-editor`).innerHTML = value;
      }
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

      if (this.validation.email && value && !value.trim().match(/[^@\s]+@[^@\s]+\.[^@\s\.]+/gi)) {
         let message = this.getWording({
            concept: "not_valid",
            text: "Not valid",
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

   toggleExplanation({}) {
      this.getNode(".explanation-text").classList.toggle("hide");
   }

   async focus({ delay }) {
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));

      if (this.textarea) {
         const length = this.quill.getLength();
         this.quill.setSelection(length, length);
      } else {
         const input = this.getNode("input");
         input.focus();
         input.selectionStart = input.value.length;
         input.selectionEnd = input.value.length;
      }
   }

   inputChange({}) {
      //Enforce number
      if (this.number) {
         let value = this.getNode("input").value.trim() + "";

         // Remove non-numeric and non-decimal characters
         let sanitizeRegex = this.negative ? /[^0-9.-]/g : /[^0-9.]/g;

         let sanitizedValue = value.replace(sanitizeRegex, "");
         //Remove any negative symbols not at start
         if (this.negative) {
            sanitizedValue = sanitizedValue.replace(/(?<=.)-/g, "");
         }

         // Ensure only one decimal point is allowed
         const decimalCount = sanitizedValue.split(".").length - 1;
         if (decimalCount > 1) sanitizedValue = sanitizedValue.slice(0, -1);

         // Limit decimal places
         if (this.decimalPlaces > 0) {
            const parts = sanitizedValue.split(".");
            if (parts[1] && parts[1].length > this.decimalPlaces) {
               sanitizedValue = parts[0] + "." + parts[1].slice(0, this.decimalPlaces);
            }
         }

         // Update the input value with the sanitized value
         this.setValue({ value: sanitizedValue });
      }

      if (this.externalListeners) {
         this.fireExternalListenerEvents({ eventTypes: "change", data: this.getValue() });
      }
   }

   passwordViewToggle({}) {
      const passwordInput = this.getNode("input");
      if (passwordInput.type === "password") {
         passwordInput.type = "text";
      } else {
         passwordInput.type = "password";
      }
   }

   submit({}) {
      if (this.submitSpinner) {
         if (this.getNode(".inline-submit").classList.contains("loading")) {
            return;
         }
         this.getNode(".inline-submit").classList.add("loading");
      }

      this.fireExternalListenerEvents({ eventTypes: "submit", data: this.getValue(), sourceObject: this });
   }

   removeSpinner({}) {
      this.getNode(".inline-submit").classList.remove("loading");
   }
}
