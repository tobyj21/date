"use strict";

class fileUploadComponent extends uiComponent {
   constructor({
      node,
      insert = "append",
      insertClass,
      label,
      addButton,
      length,
      value,
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
      this.length = length;
      this.value = value;
      this.placeholder = placeholder;
      this.key = key;
      this.hide = hide;
      this.invalid = false;

      // Register listeners
      this.registerListeners({
         className: "file-upload-action",
         listeners: [
            { function: this.add, events: ["click", "enter"] },
            { function: this.removeFile, events: ["click", "enter"] },
         ],
      });

      this.render({});
   }

   render({}) {
      let markup = ``;

      if (this.value) {
         markup += `
            <div class="file-downloads">`;

         for (let i = 0; i < this.value.length; i++) {
            const file = this.value[i];
            markup += `
               <div class="file-download-container" data-id="${file.contentId}">
                  <div class="file-download-icon icon-doc-text"></div>
                  <div class="file-download-name">${file.file}</div>
                  <button class="file-download-remove grey file-upload-action" data-action="removeFile" data-id="${file.contentId}"></button> 
               </div>
               `;
         }

         markup += `
            </div>
         `;
      }

      if (this.addButton) {
         markup += `<button class="add-button purple icon-attach file-upload-action" data-action="add">${this.addButton}</button>`;
         markup += `<div class="field-add-container hide">`;
      }

      markup += `
            <div class="form-element file input-text ${this.hide ? "hide" : ""}" data-key="${this.key}">`;

      if (this.label) {
         markup += `<label>${this.label}</label>`;
      }

      markup += `
               <div class="form-element-invalid-message"></div>
               <div class="form-element-input-container">`;

      if (this.icon) {
         markup += `<div class="form-element-icon icon-${this.icon}"></div>`;
      }

      markup += `
         <div class="form-element-upload-container">
            <input type="file" class="filepond" name="fileUpload" multiple data-max-file-size="10MB" data-max-files="10"/>
         </div>
            `;

      if (this.addButton) {
         markup += `</div>`;
      }

      markup += `</div>
         </div>`;

      this.node.innerHTML = markup;

      FilePond.registerPlugin(FilePondPluginFileValidateType);

      this.pond = FilePond.create(this.node.querySelector("input"), {
         allowReorder: true,
         labelIdle: `Drag & Drop your files or <span class="filepond--label-action">Browse</span>`,
         stylePanelLayout: "compact",
         styleLoadIndicatorPosition: "center bottom",
         styleProgressIndicatorPosition: "right bottom",
         styleButtonRemoveItemPosition: "left bottom",
         styleButtonProcessItemPosition: "right bottom",
         acceptedFileTypes: [
            "text/csv",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/epub+zip",
            "image/jpeg",
            "application/json",
            "application/vnd.oasis.opendocument.presentation",
            "application/vnd.oasis.opendocument.spreadsheet",
            "application/vnd.oasis.opendocument.text",
            "image/png",
            "application/pdf",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/rtf",
            "image/svg+xml",
            "image/tiff",
            "text/plain",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/xml",
            "application/zip",
         ],
         labelFileTypeNotAllowed: "File type not allowed",
         fileValidateTypeLabelExpectedTypes: "",
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
   }

   getValue() {
      const files = this.pond.getFiles();
      return files;
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

   removeFile({ id }) {
      this.node.querySelector(`.file-download-container[data-id="${id}"]`).remove();
      this.fireExternalListenerEvents({ eventTypes: "removeFile", data: id });
   }
}
