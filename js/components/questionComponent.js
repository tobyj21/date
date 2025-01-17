"use strict";

class questionComponent extends uiComponent {
   constructor({
      node,
      insert,
      insertClass,
      parent,
      externalListeners,
      itemConfig, // Used within interact to store config

      //General
      type,
      parts,
      value,
      text,
      textWordingId,
      textConcept,
      subtext,
      subtextWordingId,
      subtextConcept,
      inputPlaceholder,
      inputPlaceholderId,
      inputPlaceholderConcept,
      inputIcon,
      icon,
      validation,
      languageId,
      wordingModule,
      animate,

      //Select fields
      multiSelect,
      options,
      searchEnabled,
      browseEnabled,
      folderSelectEnabled,
      indexFunction,
      resultDisplayFunction,
      lookupDisplayFunction,
      showIcons,
      iconColors,

      //Text fields
      decimalPlaces,
      length,
      placeNameSearch,
      enablePartialPostcode,
      inlineSubmit,
   }) {
      super({ node, insert, insertClass, parent, externalListeners });

      this.wordingModule = wordingModule || this.getAncestorProperty({ property: "wordingModule" });
      this.languageId = languageId || this.getAncestorProperty({ property: "languageId" });

      this.itemConfig = itemConfig;

      //General
      this.type = type;
      this.parts = parts;
      this.text = text;
      this.value = value;
      this.textWordingId = textWordingId;
      this.textConcept = textConcept;
      this.subtext = subtext;
      this.subtextWordingId = subtextWordingId;
      this.subtextConcept = subtextConcept;
      this.inputPlaceholder = inputPlaceholder;
      this.inputPlaceholderId = inputPlaceholderId;
      this.inputPlaceholderConcept = inputPlaceholderConcept;
      this.inputIcon = inputIcon;
      this.icon = icon;
      this.validation = validation;
      this.animate = animate;

      //Select fields
      this.multiSelect = multiSelect;
      this.options = options;
      this.searchEnabled = searchEnabled;
      this.browseEnabled = browseEnabled;
      this.folderSelectEnabled = folderSelectEnabled;
      this.indexFunction = indexFunction;
      this.resultDisplayFunction = resultDisplayFunction;
      this.lookupDisplayFunction = lookupDisplayFunction;
      this.showIcons = showIcons;
      this.iconColors = iconColors;

      //Text fields
      this.decimalPlaces = decimalPlaces;
      this.length = length;
      this.placeNameSearch = placeNameSearch;
      this.enablePartialPostcode = enablePartialPostcode;
      this.inlineSubmit = inlineSubmit;

      this.components = {};

      this.render({});

      // Register listeners
      this.registerListeners({
         className: "question-component-action",
         listeners: [
            { function: this.change, events: ["childEvent"], stopPropagation: true },
            { function: this.select, events: ["childEvent"], stopPropagation: true },
         ],
      });
   }

   async render({}) {
      let text = this.getWording({ id: this.textWordingId, concept: this.textConcept, text: this.text });
      let subtext = this.getWording({
         id: this.subtextWordingId,
         concept: this.subtextConcept,
         text: this.subtext,
      });

      let longText = text && text.length > 75;

      let markup = `
      <div class="step-question">`;
      if (this.icon) markup += `<div class="step-question-icon icon-${this.icon}"></div>`;
      markup += `<div class="step-question-invalid-message"></div>`;
      if (text)
         markup += `<div class="step-question-text ${longText ? "small-text" : ""} fade-in-up">${
            this.animate ? "" : text
         }</div>`;
      if (subtext) markup += `<div class="step-question-sub-text fade-in-up delay-1">${subtext}</div>`;

      markup += `
         <div class="step-question-response ${this.type != "button" ? `fade-in delay-1-5` : ``}"></div>
      </div>`;

      this.node.innerHTML = markup;

      if (text && this.animate) {
         this.animateText({ text, node: this.getNode(".step-question-text") });
      }

      //Add component
      this.renderComponent({ object: this, key: "primary", firstRendered: true });

      if (this.type == "button") {
         const buttons = this.getAllNodes(".select-component-button");

         for (let i = 0; i < buttons.length; i++) {
            buttons[i].classList.add("invisible");
            setTimeout(() => {
               buttons[i].classList.remove("invisible");
               buttons[i].classList.add("fade-in-left");
            }, i * 150 + 1200);
         }
      }

      //Remove fade classes (prevent css layer issues)
      await this.wait(2100);

      this.getNode(".step-question-response").classList.remove("fade-in");
   }

   renderComponent({ object, key, firstRendered }) {
      if (["text", "textarea", "number"].includes(object.type)) {
         this.components[key] = new textInputComponent({
            node: this.getNode(".step-question-response"),
            number: object.type == "number",
            decimalPlaces: object.decimalPlaces,
            textarea: object.type == "textarea",
            icon: object.inputIcon,
            length: object.length,
            value: object.value,
            placeholder: object.inputPlaceholder,
            placeholderId: object.inputPlaceholderId,
            placeholderConcept: object.inputPlaceholderConcept,
            parent: this,
            focusOnRender: firstRendered,
            inlineSubmit: object.inlineSubmit,
            validation: object.validation,
            externalListeners: [
               {
                  type: "change",
                  action: "change",
               },
            ],
         });
      }

      if (["select", "button", "boolean"].includes(object.type)) {
         this.components[key] = new selectComponent({
            node: this.getNode(".step-question-response"),
            type: object.type == "select" ? "picker" : object.type,
            definitionOptions: object.options,
            multiSelect: object.multiSelect,
            placeholder: object.inputPlaceholder,
            placeholderId: object.inputPlaceholderId,
            placeholderConcept: object.inputPlaceholderConcept,
            value: object.value,
            icon: object.inputIcon,
            parent: this,
            searchEnabled: object.searchEnabled,
            browseEnabled: object.browseEnabled,
            folderSelectEnabled: object.folderSelectEnabled,
            indexFunction: object.indexFunction,
            resultDisplayFunction: object.resultDisplayFunction,
            lookupDisplayFunction: object.lookupDisplayFunction,
            showIcons: object.showIcons,
            iconColors: object.iconColors,
            externalListeners: [
               {
                  type: "select",
                  action: "select",
               },
               {
                  type: "deselect",
                  action: "deselect",
               },
            ],
            parent: this,
            validation: this.validation,
         });
      }

      if (object.type == "location") {
         this.components[key] = new locationInputComponent({
            node: this.node.querySelector(".step-question-response"),
            value: this.value,
            placeNameSearch: this.placeNameSearch,
            enablePartialPostcode: this.enablePartialPostcode,
            parent: this,
            externalListeners: [
               {
                  type: "change",
                  action: "change",
               },
            ],
         });
      }

      if (object.type == "multipart") {
         for (let i = 0; i < this.parts.length; i++) {
            const part = this.parts[i];
            this.renderComponent({
               object: part,
               key: part.key || i,
               firstRendered: i == 0,
            });
         }
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

   change({ data, sourceObject }) {
      this.fireExternalListenerEvents({ eventTypes: ["change"], data, sourceObject });
   }

   select({ data, sourceObject }) {
      this.fireExternalListenerEvents({ eventTypes: ["select", "change"], data, sourceObject });
   }

   deselect({ data, sourceObject }) {
      this.fireExternalListenerEvents({ eventTypes: ["select", "change"], data, sourceObject });
   }

   getValue() {
      if (this.type != "multipart") {
         return this.components.primary.getValue();
      }

      if (this.type == "multipart") {
         let value = {};

         for (let i = 0; i < this.parts.length; i++) {
            const part = this.parts[i];
            value[part.key || i] = this.components[part.key || i].getValue();
         }

         return value;
      }
   }

   validate({ scrollTo, updateUI }) {
      if (this.type != "multipart") {
         return this.components.primary.validate({ scrollTo, updateUI });
      }

      //Handle multipart validation
      let valid = true;

      if (this.type == "multipart") {
         for (let i = 0; i < this.parts.length; i++) {
            const part = this.parts[i];

            scrollTo = scrollTo && valid == true;

            if (!part.validation) continue;

            const partValidation = this.components[part.key || i].validate({ scrollTo, updateUI });
            if (!partValidation.valid) {
               valid = false;
            }
         }
      }

      return valid;
   }
}
