"use strict";

class imageUploadComponent extends uiComponent {
   constructor({
      node,
      insert = "append",
      insertClass,
      label,
      length,
      value,
      addButton,
      addButtonChild,
      icon,
      placeholder,
      hide,
      key,
      externalListeners,
      parent,
   }) {
      super({ node, insert, insertClass, externalListeners, parent });

      this.pond = null;

      this.label = label;
      this.icon = icon;
      this.addButton = addButton;
      this.addButtonChild = addButtonChild;
      this.length = length;
      this.value = value;
      this.placeholder = placeholder;
      this.key = key;
      this.hide = hide;
      this.invalid = false;

      // Register listeners
      this.registerListeners({
         className: "image-upload-action",
         listeners: [
            { function: this.add, events: ["click", "enter"] },
            { function: this.change, events: ["click", "enter"] },
            { function: this.removeImage, events: ["click", "enter"] },
         ],
      });

      this.render({});
   }

   render({}) {
      let markup = ``;

      if (this.addButton) {
         markup += `<button class="add-button purple icon-picture image-upload-action" data-action="add">${this.addButton}</button>`;
         markup += `<div class="field-add-container hide">`;
      }

      markup += `
            <div class="form-element input-text ${this.hide ? "hide" : ""}" data-key="${this.key}">`;

      if (this.label) {
         markup += `<label>${this.label}</label>`;
      }

      markup += `
               <div class="form-element-invalid-message"></div>
               <div class="form-element-input-container">`;

      if (this.icon) {
         markup += `<div class="form-element-icon icon-${this.icon}"></div>`;
      }

      if (this.value) {
         markup += `
         <div class="form-element-existing-image">
            <img src="/content/fileshare/${this.value}" class="form-element-image-preview"/>
            <div class="image-actions">
               <button class="image-upload-action grey icon-trash" data-action="removeImage">Delete image</button>
               <button class="image-upload-action icon-upload" data-action="change">Change image</button>
            </div>
         </div>`;
      }

      markup += `
         <div class="form-element-upload-container ${this.value ? "hide" : ""}">
            <input type="file" class="filepond" name="imageUpload" accept="image/png, image/jpeg"/>
         </div>
            `;

      if (this.addButton) {
         markup += `</div>`;
      }

      markup += `</div>
         </div>`;

      this.node.innerHTML = markup;

      FilePond.registerPlugin(FilePondPluginFileValidateType, FilePondPluginImagePreview);

      this.pond = FilePond.create(this.node.querySelector("input"), {
         labelIdle: `Drag & Drop your picture or <span class="filepond--label-action">Browse</span>`,
         imagePreviewHeight: 250,
         stylePanelLayout: "compact",
         styleLoadIndicatorPosition: "center bottom",
         styleProgressIndicatorPosition: "right bottom",
         styleButtonRemoveItemPosition: "left bottom",
         styleButtonProcessItemPosition: "right bottom",
      });

      this.pond.on("process", (fieldName, file, metadata, load, error, progress, abort) => {
         // Create a FormData object
         const formData = new FormData();

         // Append the file to the FormData
         formData.append(fieldName, file, file.name);

         console.log(formData);
      });
   }

   add({}) {
      this.node.querySelector(".add-button").classList.add("hide");
      this.node.querySelector(".field-add-container").classList.remove("hide");
      if (this.addButtonChild) {
         this.parent.node.querySelector(`.form-element[data-key="${this.addButtonChild}"`).classList.remove("hide");
         this.parent.fields.find((i) => i.key == this.addButtonChild).hide = false;
      }
   }

   change({}) {
      this.node.querySelector(`.form-element-upload-container`).classList.remove("hide");
      this.node.querySelector(`.form-element-existing-image`).classList.add("hide");

      if (this.addButtonChild) {
         this.parent.node.querySelector(`.form-element[data-key="${this.addButtonChild}"`).classList.remove("hide");
         this.parent.fields.find((i) => i.key == this.addButtonChild).hide = false;
      }
      this.fireExternalListenerEvents({ eventTypes: "removeImage" });
   }

   removeImage({}) {
      this.node.querySelector(`.form-element-upload-container`).classList.remove("hide");
      this.node.querySelector(`.form-element-existing-image`).classList.add("hide");
      this.fireExternalListenerEvents({ eventTypes: "removeImage" });
   }

   getValue() {
      const file = this.pond.getFile();
      return file;
   }

   showInvalid({ message }) {
      this.node.classList.add("invalid");
      this.invalid = true;
      this.node.querySelector(".form-element-invalid-message").innerHTML = message;
   }

   clearInvalid({}) {
      this.node.classList.remove("invalid");
      this.invalid = false;
   }
}
