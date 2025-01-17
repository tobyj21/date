"use strict";

class selectComponent extends uiComponent {
   constructor({
      node,
      insert,
      insertClass,
      inline,
      parent,
      type, // picker, button, boolean, checklist
      multiSelect,
      enableDeselect = false,
      value, //Current value

      //Input config
      options, //Duplicate of definitionOptions
      definitionOptions, // Specify an array of options
      definitionSource, // Required only where special types: [definitions, fieldDefinedValues, wordings, availableServices]
      fieldType, //Where fieldDefinedValues, specify which field
      definitionTypes, //Where definitions, array of which definition types to include
      definitionFilters, //Optionally provide a set of filters for provided options / definitions
      definitionApi, //Url of api source
      definitionStringParam, //Specify what parameter the input string should be sent in
      definitionApiParams, //Add any additional params to the api call (JSON)
      definitionApiResponse, //Map how the response should be processed {key: "property_name", label: "", secondaryLabel: ""}
      definitionApiType, // Allow special types of response processing (place)
      indexFunction, //Provide custom function to index results, in this format:  ({ item, object }) => {return [{ id: item.id, wording: `${item.wording}`}]},
      filterOptions, //Provide filter as object array, in this format:  [{key: "issue", label: "Issue", filters: [{property: "type", values: ["issue"], },],},
      itemWhitelist, //Limit provided options to a whitelist of keys
      itemBlacklist, //Filter provided options by a blacklist of keys
      folderWhitelist, //Limit provided options to a whitelist of folders
      folderBlacklist, //Filter provided options by a blacklist of folders
      sortFunction,

      //Search & browse config
      browseEnabled,
      flattenTree,
      searchEnabled,
      folderSearchEnabled, //Indexes the folder name for search
      folderSelectEnabled, //Allows selecting of all folder items
      folderGeneralistSelectEnabled, //Allows selecting of generalist folders
      searchMinChars = 1,
      resultDisplayFunction, // Provide custom function to display results, in this format: resultDisplayFunction: ({ item }) => { return 'markup...'}
      lookupDisplayFunction, // Same as result display function, but only apply in drop down, not in selected value
      returnUnselectedInput, // When returning component value, return unselected text input
      showIcons,
      iconColors,
      searchType = "token", // 'token' scores each token in string. 'string' does basic fuzzy match
      languageId = 2112, // Set search language for token search & wording display
      audience = "advisor", // Set search audience for wordings
      wordingModule,
      fuzzyTreshold = 0.7,
      selectOnDefocus, // Automatically select on defocus

      //Submit config
      externalListeners,
      validation,

      //UI config
      label,
      labelId, // Wording ID
      labelConcept, // Wording concept
      openOnRender,
      browseAlwaysOpen,
      treeBrowse,
      showSubmitButton,
      hideEmptySelectionPanel,
      placeholder,
      placeholderId, //Wording ID
      placeholderConcept, //Wording concept
      focusOnRender,
      clickOutAction,
      headerButtons,
      style,
   }) {
      insertClass = `${insertClass || ""} ${inline ? "inline no-padding" : ""}`;

      if (["button", "boolean", "checklist"].includes(type) && !style) style = "inline";
      if (type == "checklist") multiSelect = true;

      super({
         node,
         insert,
         insertClass: `select-component type-${type}${insertClass ? ` ${insertClass}` : ``}`,
         object: {},
         externalListeners,
         clickOutAction,
         parent,
      });

      if (!node && insert != "modal") return;

      this.apiCache = [];
      this.filters = [];

      if (folderSearchEnabled) this.searchEnabled = true;

      //Move input params onto object
      const inputKeys = arguments[0];
      for (const key in inputKeys) {
         const item = inputKeys[key];
         if (["node", "insert", "insertClass", "object"].includes(key)) continue;
         this[key] = item;
      }
      if (multiSelect) this.multiSelect = true;

      this.wordingModule = this.wordingModule || this.getAncestorProperty({ property: "wordingModule" });
      this.languageId = this.languageId || this.getAncestorProperty({ property: "languageId" });
      this.audience = this.audience || this.getAncestorProperty({ property: "audience" });

      if (options && !this.definitionOptions) this.definitionOptions = options;
      if (!this.type) this.type = "picker";

      //Set definition source where derivable
      if (!definitionSource) {
         if (definitionApi) this.definitionSource = "api";
      }

      // Register listeners
      this.registerListeners({
         className: "select-component-action",
         listeners: [
            { function: this.inputKeyUp, events: ["keyUp"] },
            { function: this.inputBackspace, events: ["backspace"] },
            { function: this.inputEnter, events: ["enter"] },
            { function: this.inputFocus, events: ["focus"] },
            { function: this.inputBlur, events: ["blur"] },
            { function: this.resultSelect, events: ["click", "enter"] },
            { function: this.checklistClick, events: ["click", "enter"] },
            { function: this.booleanClick, events: ["click", "enter"] },
            { function: this.browserBack, events: ["click", "enter"] },
            { function: this.buttonClick, events: ["click", "enter"] },
            { function: this.apiResultSelect, events: ["click", "enter"] },
            { function: this.apiResultExplore, events: ["altClick"] },
            { function: this.toggleFilter, events: ["click", "enter"] },
            { function: this.headerButton, events: ["click", "enter"] },
            { function: this.deselect, events: ["click", "enter"] },
            { function: this.submit, events: ["click", "enter"] },
            { function: this.selectionToggle, events: ["click", "enter"] },
            { function: this.browseClickOut, events: ["clickOut"] },
            { function: this.overlayClick, events: ["click", "enter"] },
         ],
      });

      //Build options
      this.data = [];
      this.dataTree = [];
      this.unparentedItems = [];
      if (definitionSource != "api") {
         this.buildData();
         if (this.searchEnabled) {
            this.interactSearch = new interactSearch({
               parentObject: this,
               tokenMatch: this.searchType == "token",
               languageId: this.languageId,
               fuzzyTreshold: this.fuzzyThreshold,
            });
         }
      }

      this.mode = browseEnabled ? "browse" : "search";
      this.browseHistory = [];

      this.value = value ? value : this.multiSelect ? [] : null;
      if (!Array.isArray(this.value) && this.multiSelect) {
         console.log("Warning: Multi-select value is not an array");
      }
      this.headerButtons = headerButtons;

      //Initialize
      this.initialize();

      if (this.value && !this.multiSelect) {
         this.displaySingleSelectedItem({ value: this.value, init: true });
      }

      if (focusOnRender && searchEnabled) {
         this.focus({});
      }

      this.browseOpened = false;
      this.invalid = false;
   }

   buildData() {
      //Collate input data
      let inputData = [];

      const filterProperties = this.getFilterProperties();

      //Provided options
      if (this.definitionOptions) {
         inputData = this.definitionOptions;
      }

      //Defined values
      if (this.definitionSource == "fieldDefinedValues") {
         inputData = stepConfig.fields[this.fieldType].definedValues;
      }

      if (this.definitionSource == "definitions") {
         //Definitions
         for (let i = 0; i < this.definitionTypes.length; i++) {
            const type = this.definitionTypes[i];

            for (let d = 0; d < definitions[type].length; d++) {
               const definition = definitions[type][d];

               if (this.definitionFilters && this.definitionFilters.length) {
                  const filtersPassed = this.testFilters({ item: definition });
                  if (!filtersPassed) continue;
               }

               if (definition.type == type || type.includes(definition.type) || definition.sub_type == type)
                  inputData.push(definition);
            }
         }
      }

      //Wordings
      if (this.definitionSource == "wordings") {
         inputData = this.definitionOptions;
      }

      //Available services
      if (this.definitionSource == "availableServices") {
         inputData = orgData.services.filter((s) => s.status == "active");
      }

      //Test if to include top-level folder
      const includeTop =
         !(this.itemWhitelist && this.itemWhitelist.length) && !(this.folderWhitelist && this.folderWhitelist.length);

      //Build
      this.dataTree = this.buildDataItems({ node: inputData, include: includeTop, filterProperties });

      //Add any unparented items
      for (let i = 0; i < this.unparentedItems.length; i++) {
         const item = this.unparentedItems[i];
         //Check if findable in tree
         const found = this.findItemInTree({ key: item.key, node: this.dataTree });
         //Add to top level if not findable
         if (!found) {
            this.dataTree.push(item);
         }
      }

      this.isTreeData = !!this.dataTree.find((i) => i.children && i.children.length);
      // console.log(this);
   }

   testFilters({ item }) {
      for (let i = 0; i < this.definitionFilters.length; i++) {
         const filter = this.definitionFilters[i];
         const itemProperty = item[filter.property];
         if (filter.values.includes(itemProperty)) {
            return true;
         }
      }
   }

   getFilterProperties() {
      const properties = [];
      if (!this.filterOptions) return properties;
      for (let i = 0; i < this.filterOptions.length; i++) {
         const filterSet = this.filterOptions[i];
         for (let f = 0; f < filterSet.filters.length; f++) {
            const filter = filterSet.filters[f];
            if (!properties.includes(filter.property)) properties.push(filter.property);
         }
      }
      return properties;
   }

   buildDataItems({ node, include, filterProperties }) {
      const items = [];
      for (let i = 0; i < node.length; i++) {
         const item = node[i];
         const key = this.createItemKey({ item });

         //Filter item
         const isFolder = item.children && item.children.length ? true : false;
         let includeItem = include;
         let includeFolder = include;

         //Folder filters
         if (isFolder) {
            if (this.folderWhitelist && this.folderWhitelist.length) {
               if (this.folderWhitelist.includes(key)) {
                  includeItem = true;
                  includeFolder = true;
               } else {
                  includeItem = false;
                  includeFolder = false;
               }
            }

            if (this.folderBlacklist && this.folderBlacklist.length && this.folderBlacklist.includes(key)) {
               includeItem = false;
               includeFolder = false;
            }
         }

         //Item filters
         if (this.itemWhitelist && this.itemWhitelist.length) {
            includeItem = this.itemWhitelist.includes(key);
         }
         if (this.itemBlacklist && this.itemBlacklist.length && this.itemBlacklist.includes(key)) {
            includeItem = false;
         }

         //Build child items
         let children = [];
         if (item.children)
            children = this.buildDataItems({ node: item.children, include: includeFolder, filterProperties });

         //If inclusion, add
         if (includeItem) {
            //Check if already exists
            let dataItem = this.data.find((i) => i.key == key);

            //If not, create item & add to data items
            if (!dataItem) {
               dataItem = this.buildDataItem({
                  item,
                  key,
                  filterProperties,
               });
               dataItem.children = children.length;
               this.data.push(dataItem);
            }

            //Duplicate (to avoid byRef errors) && add to node items
            let treeItem = JSON.parse(JSON.stringify(dataItem));
            delete treeItem.index;
            treeItem.children = children;

            items.push(treeItem);
         }
      }

      //Where useful items found, but node is not set to include, store for later
      if (items.length && !include) {
         for (let i = 0; i < items.length; i++) {
            const item = items[i];
            //Add to unparented items
            if (!this.unparentedItems.find((i) => i.key == item.key)) this.unparentedItems.push(item);
         }
      }

      return items;
   }

   createItemKey({ item }) {
      if (typeof item == "string") return item;
      if (item.id) return parseInt(item.id);
      if (item.key || item.key === 0) return item.key;
      console.log("error: no key field found in input data");
   }

   buildDataItem({ item, key, filterProperties }) {
      // Get wording versions
      const wordingVersions = this.getItemWordingVersions({ item });

      const dataItem = {
         key,
         wordings: wordingVersions,
         icon: item.icon,
         isGeneralist: item.generalist,
      };

      if (this.sortFunction == "definitionParents") {
         dataItem.parents = item.parents;
      }

      for (let i = 0; i < filterProperties.length; i++) {
         const property = filterProperties[i];
         dataItem[property] = item[property];
      }

      if (this.resultDisplayFunction) {
         dataItem.item = item;
      }
      return dataItem;
   }

   getItemWordingVersions({ item }) {
      let wordingVersions = [];

      //Where wording type, get best version
      if (this.definitionSource == "wordings") {
         const relevantWordings = item.versions.filter(
            (v) => v.language_id == 2112 || v.language_id == this.languageId || this.languageId == 0
         );
         if (relevantWordings.length) return relevantWordings;
         return [
            {
               id: 0,
               audience: "advisor",
               wording: `${item.id} [undefined]`,
            },
         ];
      }

      //Where index function provided, use it
      if (this.indexFunction) {
         wordingVersions = this.indexFunction({ item, object: this });
         return wordingVersions;
      }

      if (typeof item == "string") {
         wordingVersions.push({
            id: 0,
            audience: "advisor",
            default: true,
            wording: item,
         });
         return wordingVersions;
      }

      if (item.name) {
         wordingVersions.push({
            id: 0,
            audience: "advisor",
            default: true,
            wording: item.name,
         });
      }

      if (item.label) {
         wordingVersions.push({
            id: 0,
            audience: "advisor",
            default: true,
            wording: item.label.toString(),
         });
      }

      if (item.aliases) {
         for (let i = 0; i < item.aliases.length; i++) {
            const alias = item.aliases[i];
            wordingVersions.push({
               id: alias.id,
               audience: "advisor",
               default: false,
               wording: alias.name,
            });
         }
      }

      if (item.key && !item.name && !item.label && !item.aliases) {
         wordingVersions.push({
            id: 0,
            audience: "advisor",
            default: true,
            wording: item.key,
         });
      }

      if (!wordingVersions.length) {
         wordingVersions.push({
            id: 0,
            audience: "advisor",
            wording: `${item.id || item.key} [undefined]`,
         });
      }

      return wordingVersions;
   }

   findItemInTree({ key, node }) {
      for (let i = 0; i < node.length; i++) {
         const item = node[i];
         if (item.key == key) return item;
         if (item.children && item.children.length) {
            const found = this.findItemInTree({ key, node: item.children });
            if (found) return found;
         }
      }
      return false;
   }

   collateOptions({ type, folders, excludeFolders, excludeItems }) {
      function traverseBranch({ branch, folders, excludeFolders, excludeItems, options, include }) {
         for (let i = 0; i < branch.length; i++) {
            const item = branch[i];
            let includeFolder = include ? true : folders.includes(parseInt(item.id));
            let excludeFolder = excludeFolders.includes(parseInt(item.id));
            let excludeItem = excludeItems.includes(parseInt(item.id));

            if ((include || includeFolder) && !excludeFolder && !excludeItem) {
               options.add(item);
            }

            if (item.children && item.children.length) {
               traverseBranch({
                  branch: item.children,
                  folders,
                  excludeFolders,
                  excludeItems,
                  options,
                  include: includeFolder && !excludeFolder,
               });
            }
         }
         return options;
      }
   }

   renderButtons() {
      let markup = `<div class="select-component-button-container  ${this.showIcons ? "icons-on" : ""}">`;

      let iconColor = 0;

      for (let i = 0; i < this.definitionOptions.length; i++) {
         const option = this.definitionOptions[i];

         let isSelected = option.key == this.value;
         if (this.multiSelect && this.value) {
            isSelected = this.value.includes(option.key);
         }

         if (option.default && (!this.value || (this.multiSelect && !this.value.length))) {
            isSelected = true;

            //Where no value supplied, set as field value
            if (this.value == undefined) {
               if (this.multiSelect) {
                  this.value.push(option.key);
               } else {
                  this.value = option.key;
               }
            }
         }

         iconColor++;
         if (iconColor > 9) iconColor = 0;

         markup += `
            <button class="select-component-button ${isSelected ? "selected" : ""} ${
            this.showIcons ? "has-icon" : ""
         } select-component-action" data-action="buttonClick" data-key="${option.key}" tabindex="0">`;

         if (this.showIcons) {
            markup += `<span class="select-component-button-icon  ${
               this.iconColors ? `icon-color-${iconColor}` : ""
            } icon-${option.icon}"></span>`;
         }
         markup += this.getWording({
            id: option.wordingId,
            concept: option.concept,
            definitionId: option.definitionId,
            text: option.label,
         });

         if (option.subText || option.subtextWordingId || option.subtextConcept) {
            const subText = this.getWording({
               id: option.subtextWordingId,
               concept: option.subtextConcept,
               text: option.subText,
            });
            if (subText) {
               markup += `<div class="select-component-button-subtext">${subText}</div>`;
            }
         }

         markup += `  
            </button>
         `;
      }

      markup += `</div>`;

      return markup;
   }

   buttonClick({ key }) {
      //Get current value
      let button = this.node.querySelector(`.select-component-button[data-key="${key}"]`);
      let isSelected = button.classList.contains("selected");

      //Handle deselection
      if (isSelected) {
         //Do nothing if single-select && required
         if ((!this.multiSelect && this.required) || !this.enableDeselect) return;

         //Else select
         button.classList.remove("selected");
      }

      //Handle selection
      if (!isSelected) {
         //Where single select, clear any other options
         if (!this.multiSelect) {
            this.node.querySelectorAll(".select-component-button.selected").forEach((button) => {
               button.classList.remove("selected");
            });
         }

         //Add selection
         button.classList.add("selected");
      }

      //Update value and fire any listeners
      this.updateValueFromButton();

      //Fire any external listener events
      this.fireExternalListenerEvents({ eventTypes: ["select", "change"], data: this.getValue() });
   }

   updateValueFromButton() {
      //Handle single value
      if (!this.multiSelect) {
         const selectedButton = this.node.querySelector(`.select-component-button.selected`);
         if (selectedButton) {
            let key = selectedButton.dataset.key;
            //Where number, parse as integer
            if (!isNaN(key)) key = parseInt(key);
            this.value = key;
         } else {
            this.value = null;
         }
      }

      //Handle multiple values
      if (this.multiSelect) {
         const selectedButtons = this.node.querySelectorAll(`.select-component-button.selected`);
         this.value = [];
         selectedButtons.forEach((button) => {
            //Where number, parse as integer
            let key = button.dataset.key;
            if (!isNaN(key)) key = parseInt(key);
            this.value.push(key);
         });
      }
   }

   initialize() {
      let markup = ` 
         <div class="form-element-invalid-message"></div>
         ${this.label && this.type !== "boolean" ? `<label>${this.label}</label>` : ``}
        <div class="select-component-container ${this.type == "boolean" ? "boolean" : ""} ${
         this.multiSelect ? "multiselect" : ""
      } ${this.type == "button" ? "buttons" : ""} select-component-action ${
         this.style ? this.style : ``
      }" data-action="clickOut">
      `;

      //Render buttons
      if (this.headerButtons) {
         markup += this.renderHeaderButtons();
      }

      //Render selection panel
      if (this.multiSelect && ["picker"].includes(this.type)) {
         markup += this.renderSelectionPanel();
      }

      if (this.filterOptions) {
         //Render filters
         markup += this.renderFilters();
      }

      if (this.type == "button") {
         //Render buttons
         markup += this.renderButtons();
      }

      //Render pickers
      if (this.type == "picker") {
         if (this.searchEnabled) {
            let placeHolder = this.getWording({
               id: this.placeholderId,
               concept: this.placeholderConcept,
               defaultConcept: "search",
               text: this.placeholder,
               defaultText: "Search...",
            });

            markup += `
         <div class="select-component-input-container">
            <span class="icon-search"></span>
            <input type="text" class="select-component-input select-component-action" data-action="inputKeyUp,inputBackspace,inputEnter,inputFocus,inputBlur" placeholder="${placeHolder}" spellcheck="false" tabindex="0">
         </div>`;
         }

         if (!this.searchEnabled) {
            if (!this.multiSelect) {
               markup += `
                <div class="select-component-selection select-component-action" data-action="selectionToggle">
                  ${this.renderSingleSelection({ value: this.value })}
               </div>`;
            }
         }

         markup += ` 
         <div class="select-component-selector select-component-action" data-action="browseClickOut">`;

         markup += `<div class="select-component-browse  ${this.showIcons ? "icons-on" : ""}"></div>`;

         if (this.searchEnabled) {
            markup += `<div class="select-component-results  ${this.showIcons ? "icons-on" : ""}"></div>`;
         }

         markup += `
            <div class="interact-component"></div>
         </div>
         `;
      }

      if (this.type == "checklist") {
         markup += this.renderChecklist({});
      }

      if (this.type == "boolean") {
         markup += this.renderBoolean({});
      }

      markup += `</div>`;

      this.node.innerHTML = markup;

      if (this.browseEnabled && (this.openOnRender || this.browseAlwaysOpen)) {
         this.displayBrowse({ dataTree: this.dataTree, direction: this.browseHistory.length > 0 ? "back" : "forward" });
      }
   }

   renderSingleSelection({ value }) {
      if (value) {
         let label = this.renderItem({ item: value });
         return label;
      } else {
         let placeHolder = this.getWording({
            text: this.placeholder,
            id: this.placeholderId,
            concept: this.placeholderConcept,
            defaultText: "Select...",
            defaultConcept: "select",
         });

         return placeHolder;
      }
   }

   inputKeyUp({ event }) {
      //Handle up/down keys

      //Down key
      if (event.keyCode == 40) {
         return this.downKeyPress();
      }

      //Up Key
      if (event.keyCode == 38) {
         return this.upKeyPress();
      }

      let string = this.getInputValue();

      //Where single select, deselect value
      if (!this.multiSelect) {
         this.value = null;
         //Where overlay present, clear field
         const overlay = this.node.querySelector(`.select-component-selected-overlay`);
         if (overlay) overlay.remove();
      }

      //Handle API searches
      if (this.definitionSource == "api" && string.length) {
         return this.apiLookup({ string });
      }

      if (!this.searchMinChars || string.length >= this.searchMinChars) {
         //Do search where sufficient characters
         const results = this.search({ string });
         this.displayResults({ results });
         return;
      }

      //Else revert to browse if enabled
      if (this.browseEnabled && this.mode == "search") {
         this.displayBrowse({ dataTree: this.dataTree, direction: "forward" });
      }
   }

   inputBackspace({ event }) {
      let string = this.getInputValue();

      //Where single select, deselect value
      if (!this.multiSelect && this.value) {
         this.deselect({ key: this.value });
         string = "";
      }

      if (this.definitionSource == "api") {
         return this.apiLookup({ string });
      }

      //Update search if sufficient characters
      if (string.length >= this.searchMinChars) {
         const results = this.search({ string });
         this.displayResults({ results });
         return;
      }

      //Else revert to browse if enabled
      if (this.browseEnabled && this.mode == "search") {
         this.displayBrowse({ dataTree: this.dataTree, direction: this.browseHistory.length > 0 ? "back" : "forward" });
      }
   }

   inputEnter({}) {
      const selected = this.node.querySelector(".select-component-result.selected");
      if (!selected) return;
      this.resultSelect({ key: selected.dataset.key });
   }

   async inputFocus({}) {
      await new Promise((resolve) => setTimeout(resolve, 250));

      let string = this.getInputValue();

      if (
         this.browseEnabled &&
         (!this.browseOpened || this.node.querySelector(`.select-component-browse`).classList.contains("hide"))
      ) {
         this.displayBrowse({
            dataTree: this.dataTree,
            direction: this.browseHistory.length > 0 ? "back" : "forward",
         });
      }

      //Handle API searches
      if (this.definitionSource == "api") {
         return this.apiLookup({ string });
      }

      if (string && (!this.searchMinChars || string.length >= this.searchMinChars)) {
         //Do search where sufficient characters
         const results = this.search({ string });
         this.displayResults({ results });
         return;
      }

      //Else revert to browse if enabled
      if (this.browseEnabled && this.mode == "search") {
         this.displayBrowse({ dataTree: this.dataTree, direction: "forward" });
      }
   }

   inputBlur({}) {
      //Where single select field and text input is identical to browser match, select
      if (!this.multiSelect && !this.value && this.selectOnDefocus) {
         const inputValue = this.getInputValue();
         if (!inputValue) return;
         if (!this.topResult) return;
         if (this.topResult.wordings[0].wording.toLowerCase() == inputValue.toLowerCase()) {
            this.selectItem({ item: this.topResult });
         }
      }
   }

   search({ string }) {
      if (this.data) {
         let results = this.interactSearch.search({ string, data: this.data, dataTree: this.dataTree });
         results = this.filterData({ items: results });
         return results;
      }

      return [];
   }

   displayBrowse({ dataTree, direction, folderBrowse, expandTo, expandToDepth, parentId = 0 }) {
      this.show({ selector: `.select-component-browse` });
      this.hide({ selector: `.select-component-results` });
      this.mode = "browse";
      this.browseOpened = true;

      if (this.sortFunction == "definitionParents") {
         dataTree.sort((a, b) => {
            let aOrder = a.parents.find((p) => p.parent_id == parentId);
            aOrder = aOrder ? aOrder.sort_order : 0;
            let bOrder = b.parents.find((p) => p.parent_id == parentId);
            bOrder = bOrder ? bOrder.sort_order : 0;
            return aOrder - bOrder;
         });
      }

      if (direction == "forward") this.browseHistory.push(dataTree);
      if (direction == "back" && this.browseHistory.length > 1) this.browseHistory.pop();

      let markup = ``;

      if (this.browseHistory.length > 1 && this.isTreeData && !this.treeBrowse) {
         let backLabel = this.getWording({
            defaultText: "Back",
            concept: "back",
         });

         markup += `<button class="select-component-browser-back slide-in-left select-component-action" data-action="browserBack"  tabindex="0">${backLabel}</button>`;
      }

      let items = this.filterData({ items: dataTree });
      if (!this.isTreeData) {
         items = this.filterData({ items: this.data });
      }

      this.topResult = items[0];

      if (!this.multiSelect && this.enableDeselect) {
         markup += `
         <div class="select-component-result selectable select-component-action " data-action="resultSelect" data-key="null" tabindex="0">
                <div class="select-component-result-label deselect-option">
                    None
                </div>
                <div class="select-component-result-actions"><span class="select-component-results-indicator "></span></div>
         </div>
         `;
      }

      for (let i = 0; i < items.length; i++) {
         const item = items[i];

         let selected = false;
         if (this.multiSelect) {
            selected = this.value.includes(item.key);
         } else {
            selected = this.value == item.key;
         }

         markup += this.renderResult({
            item,
            selected,
            folderBrowse,
            folderBack: direction == "back",
            depth: expandToDepth,
         });
      }

      //Where empty branch, display empty message
      if (!dataTree.length) {
         markup += `<div class="select-component-result-none">No items</div>`;
      }

      if (this.treeBrowse && expandTo) {
         const expandNode = this.node.querySelector(`.select-component-result[data-key="${expandTo}"].minimized`);
         expandNode.classList.remove("minimized");
         this.insertMarkup({ node: expandNode, markup, selector: `.select-component-browse`, insert: "after" });
         return;
      }

      this.node.querySelector(`.select-component-browse`).innerHTML = markup;

      const browseContainer = this.node.querySelector(`.select-component-selector`);

      const visibility = this.checkVisibility({ node: browseContainer });
      if (visibility.bottomClipped) {
         const minVisible = 90;
         browseContainer.style.maxHeight = `${Math.max(visibility.bottomVisibleAmount, minVisible)}px`;
      }
   }

   renderResult({ item, useWordingScore, selected, folderBrowse, folderBack, depth = 0 }) {
      const isFolder = !this.flattenTree && item.children && (!Array.isArray(item.children) || item.children.length);
      let isSelectable = !isFolder || this.folderSelectEnabled || item.isGeneralist;
      const isSelectableFolder = isFolder && isSelectable && this.browseEnabled;
      let wording = item.wordings[0].wording;

      if (useWordingScore) {
         //Get best scored wording
         let bestWording;
         let bestScore = -1;
         for (let w = 0; w < item.wordings.length; w++) {
            const wording = item.wordings[w];
            if (wording.score > bestScore) {
               bestScore = wording.score;
               bestWording = wording;
            }
         }
         if (bestWording) {
            wording = bestWording.wording;
         }
      }

      if (this.resultDisplayFunction) wording = this.resultDisplayFunction({ item: item.item, wording });
      wording = this.resultDisplayFunction ? wording : this.sanitizeDisplay({ text: wording });

      if (this.lookupDisplayFunction) wording = this.lookupDisplayFunction({ item, wording });

      let indent = "";
      if (this.treeBrowse) {
         indent = `depth-${depth}`;
      }

      let markup = `
      <div class="select-component-result ${indent} ${folderBrowse && !this.treeBrowse ? "slide-left-in" : ""}${
         folderBack && !this.treeBrowse ? "slide-right-in" : ""
      } ${isSelectable ? `ripple selectable` : ``} ${
         isSelectableFolder && this.treeBrowse ? `minimized` : ``
      } select-component-action ${selected ? "selected" : ""}" data-action="resultSelect" data-key="${item.key}"  ${
         isSelectable ? `tabindex="0"` : ``
      } ${isSelectableFolder ? `data-folderaction="expand"` : ``} ${
         this.treeBrowse ? `data-depth="${depth}"` : ``
      } ${indent}>`;

      if (this.showIcons) {
         markup += `<span class="select-component-result-icon icon-${item.icon}"></span>`;
      }
      markup += `
                <div class="select-component-result-label">
                    ${wording}
                </div>
                <div class="select-component-result-actions">`;

      if (this.flattenTree || !isFolder || !isSelectableFolder || !this.browseEnabled) {
         markup += `<span class="select-component-results-indicator ${
            !this.flattenTree && isFolder && this.browseEnabled ? "folder" : ""
         }"></span>`;
      }

      if (isSelectableFolder && this.browseEnabled) {
         markup += `
             <button class="select-component-results-folder folder-select select-component-action" data-action="resultSelect" data-key="${item.key}" data-folderaction="select" tabindex="0">Select folder</button>
         `;
      }

      markup += `</div>`;

      markup += `
      </div>
        `;

      return markup;
   }

   displayResults({ results }) {
      this.hide({ selector: `.select-component-browse` });
      this.show({ selector: `.select-component-results` });
      this.mode = "search";

      this.topResult = results[0];

      // console.log(results);
      let markup = ``;
      //Handle no results
      if (!results.length) {
         markup += `
         <div class="select-component-result-none">
            ${this.getWording({
               concept: "no_matches_found",
               defaultText: `No matches found`,
            })}
         </div>`;
      }

      //Handle results
      if (results.length) {
         for (let i = 0; i < results.length; i++) {
            const result = results[i];

            markup += this.renderResult({ item: result, useWordingScore: true, selected: i == 0 });
         }
      }

      //Show results
      this.node.querySelector(`.select-component-results`).innerHTML = markup;
   }

   async resultSelect({ key, folderaction }) {
      //Wait
      await new Promise((resolve) => setTimeout(resolve, 100));

      let item;
      if (this.mode == "browse") {
         item = this.findItemInTree({ key, node: this.dataTree && this.dataTree.length ? this.dataTree : this.data });
         // item = this.browseHistory[this.browseHistory.length - 1].find((item) => item.key == key);
      }

      if (this.mode == "search") {
         item = this.findItemInTree({ key, node: this.dataTree });
      }

      //Where not folder, or not browse-enabled select item
      if (!item.children || !item.children.length || !this.browseEnabled) return this.selectItem({ item });

      //Where folder

      //If folder is selectable
      if (this.folderSelectEnabled || item.isGeneralist) {
         if (folderaction == "select") return this.selectItem({ item });
      }

      if (!this.treeBrowse) {
         await this.animateResultsOut({ key });
      }

      //Open folder
      let childDepth = 0;
      if (this.treeBrowse) {
         const selected = this.node.querySelector(`.select-component-result[data-key="${key}"]`);
         let open = !selected.classList.contains("minimized");
         childDepth =
            parseInt(this.node.querySelector(`.select-component-result[data-key="${key}"]`).dataset.depth) + 1;

         //Where already open, close children
         if (open) {
            return this.closeChildren({ selected, childDepth });
         }
      }

      this.displayBrowse({
         dataTree: item.children,
         direction: "forward",
         folderBrowse: true,
         expandTo: key,
         expandToDepth: childDepth,
         parentId: item.key,
      });
   }

   checklistClick({ key }) {
      //Get from tree (avoids parseInt issues)
      const item = this.findItemInTree({ key, node: this.dataTree });
      key = item.key;
      const select = !this.value.includes(key);

      const node = this.node.querySelector(`.select-component-checklist-item[data-key="${key}"]`);

      if (select) {
         this.value.push(key);
         node.classList.add("selected");
         this.fireExternalListenerEvents({ eventTypes: ["select", "change"], data: key });
      }

      if (!select) {
         this.value = this.value.filter((i) => i != key);
         node.classList.remove("selected");
         this.fireExternalListenerEvents({ eventTypes: ["deselect", "change"], data: key });
      }
   }

   booleanClick({}) {
      this.value = !this.value;
      const node = this.node.querySelector(`.select-component-toggle`);
      node.classList.toggle("selected");

      this.fireExternalListenerEvents({ eventTypes: ["select", "change"], data: this.value });
   }

   closeChildren({ selected, childDepth }) {
      selected.classList.add("minimized");

      //loop siblings
      let sibling = selected.nextElementSibling;
      while (sibling) {
         if (parseInt(sibling.dataset.depth) != childDepth) return;
         let nextSibling = getNextSibling({ element: sibling, depth: childDepth });
         //Close any children of sibling
         if (sibling.dataset.folderaction == "expand" && !sibling.classList.contains("minimized")) {
            this.closeChildren({ selected: sibling, childDepth: childDepth + 1 });
         }
         //Remove sibling
         sibling.remove();

         sibling = nextSibling;
      }

      function getNextSibling({ element, depth }) {
         let sibling = element.nextElementSibling;
         while (sibling) {
            if (parseInt(sibling.dataset.depth) > depth) {
               sibling = sibling.nextElementSibling;
               continue;
            }
            if (parseInt(sibling.dataset.depth) < depth) return;
            return sibling;
         }
      }
   }

   async animateResultsOut({ key }) {
      try {
         let selectedNode;
         this.node.querySelectorAll(".select-component-result").forEach((item) => {
            const itemKey = item.dataset.key;
            if (key == itemKey) {
               selectedNode = item;
               return;
            }
            item.classList.remove("slide-right-in");
            item.classList.remove("slide-left-in");
            item.classList.add("slide-left-out");
         });

         await new Promise((resolve) => setTimeout(resolve, 300));
         selectedNode.classList.remove("slide-right-in");
         selectedNode.classList.remove("slide-left-in");
         selectedNode.classList.add("slide-left-out");

         await new Promise((resolve) => setTimeout(resolve, 600));
      } catch (error) {}
   }

   browserBack({}) {
      this.displayBrowse({ dataTree: this.browseHistory[this.browseHistory.length - 2], direction: "back" });
   }

   downKeyPress() {
      const selected = this.node.querySelector(".select-component-result.selected");
      if (!selected) {
         return this.node.querySelector(".select-component-result").classList.add("selected");
      }

      const nextSibling = selected.nextElementSibling;
      if (nextSibling && nextSibling.classList.contains("select-component-result")) {
         selected.classList.remove("selected");
         nextSibling.classList.add("selected");
      }
   }

   upKeyPress() {
      const selected = this.node.querySelector(".select-component-result.selected");
      const previousSibling = selected.previousElementSibling;

      if (previousSibling && previousSibling.classList.contains("select-component-result")) {
         selected.classList.remove("selected");
         previousSibling.classList.add("selected");
      }
   }

   async selectItem({ item, noEvent }) {
      //Handle deselect
      if (!item) {
         this.value = null;
         const overlay = this.node.querySelector(`.select-component-selected-overlay`);
         if (overlay) overlay.remove();

         if (this.node.querySelector(`.select-component-selection`)) {
            this.node.querySelector(`.select-component-selection`).innerHTML = this.renderSingleSelection({
               value: null,
            });
         }

         if (!this.browseAlwaysOpen) {
            this.hide({ selector: `.select-component-browse` });
         }
         return;
      }

      // console.log(item);
      if (!this.multiSelect && !this.treeBrowse && !this.browseAlwaysOpen) {
         await this.animateResultsOut({ key: item.key });
      }

      const result = this.node.querySelector(`.select-component-result[data-key="${item.key}"]`);

      //Where single select, deselect any existing
      if (!this.multiSelect) {
         this.node.querySelectorAll(".select-component-result.selected").forEach((result) => {
            result.classList.remove("selected");
         });
      }

      //Add selected class
      result.classList.add("selected");

      //Store value
      if (!this.multiSelect) {
         this.value = item.key;

         const overlay = this.node.querySelector(`.select-component-selected-overlay`);
         if (overlay) overlay.remove();

         //Remove existing

         this.displaySingleSelectedItem({ value: item.key });

         if (!this.browseAlwaysOpen) {
            this.hide({ selector: `.select-component-results` });
            this.hide({ selector: `.select-component-browse` });
         }
      }

      if (this.multiSelect) {
         if (!this.value.find((value) => value == item.key)) {
            this.value.push(item.key);
         }

         if (["picker"].includes(this.type) && this.multiSelect) {
            this.refreshSelectionPanel();
         }
      }

      if (this.searchEnabled && this.multiSelect) {
         this.node.querySelector(`.select-component-input`).value = "";
      }

      //Fire any external listener events
      if (!noEvent) {
         this.fireExternalListenerEvents({ eventTypes: ["select", "change"], data: item.key });
      }
   }

   displaySingleSelectedItem({ value, init }) {
      const input = this.node.querySelector(`.select-component-input`);

      //Text input types
      if (input) {
         input.value = this.renderItem({ item: value });
         if (!init && !this.browseAlwaysOpen) {
            this.hide({ selector: `.select-component-browse` });
         }

         this.insertMarkup({
            node: this.node.querySelector(`.select-component-input-container`),
            markup: `
            <span class="select-component-selected-overlay select-component-action" data-action="overlayClick">
               ${input.value}
               <button class="select-component-selected-overlay-remove select-component-action" data-action="deselect" data-key="${value}"></button>
            </span>`,
         });
      }

      //Select
      if (!input) {
         const selection = this.node.querySelector(`.select-component-selection`);
         if (selection) {
            selection.innerHTML = this.renderItem({ item: value });
         }
      }
   }

   sanitizeDisplay({ text }) {
      if (!text) return "unknown";

      //Remove any markup (where custom function not provided)
      if (!this.resultDisplayFunction) {
         text = text.replace(/<\/?[^>]+(>|$)/g, "");
      }

      return text;
   }

   getItemDefinition({ key }) {
      if (this.definitionSource == "api") {
         for (let i = 0; i < this.apiCache.length; i++) {
            const apiSearch = this.apiCache[i];
            for (let r = 0; r < apiSearch.results.length; r++) {
               const result = apiSearch.results[r];
               if (result.key == key || result.id == key) return result;
            }
         }
      }

      return this.findItemInTree({ key, node: this.dataTree });
   }

   deselect({ key, noEvent }) {
      if (this.multiSelect) {
         this.value = this.value.filter((value) => value != key);
      } else {
         this.value = null;

         //Where overlay present, clear field
         const overlay = this.node.querySelector(`.select-component-selected-overlay`);
         if (overlay) {
            overlay.remove();
            this.node.querySelector(`.select-component-input`).value = "";
         }
      }

      if (["picker"].includes(this.type) && this.multiSelect) {
         this.refreshSelectionPanel();
      }

      //Fire any external listener events
      if (!noEvent) {
         this.fireExternalListenerEvents({ eventTypes: ["deselect", "change"], data: key });
      }
   }

   submit({}) {
      //Fire any external listener events
      this.fireExternalListenerEvents({ eventTypes: ["submit"], data: this.getValue() });
   }

   clickOut({}) {
      //Look for external event listeners
      if (!this.externalListeners) return;
      for (let i = 0; i < this.externalListeners.length; i++) {
         const listener = this.externalListeners[i];
         if (listener.type == "clickOut") {
            this.parent.childEventHandler({ action: listener.action });
            return;
         }
      }

      if (!this.browseAlwaysOpen) {
         this.hide({ selector: `.select-component-browse` });
         this.hide({ selector: `.select-component-results` });
      }
      this.remove();
   }

   async focus({ delay }) {
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      const input = this.node.querySelector(`.select-component-input`);

      if (input) {
         input.focus();
         input.selectionStart = input.value.length;
         input.selectionEnd = input.value.length;
      } else {
         this.selectionToggle({});
      }
   }

   clearInput() {
      this.node.querySelector(`.select-component-input`).value = "";
   }

   showBrowsePanel() {
      if ((this.mode = "search")) {
         this.hide({ selector: `.select-component-browse` });
         this.show({ selector: `.select-component-results` });
      } else {
         this.show({ selector: `.select-component-browse` });
         this.hide({ selector: `.select-component-results` });
      }
   }

   getValue() {
      if (!this.value && this.returnUnselectedInput) {
         return this.getInputValue();
      }

      return this.value;
   }

   validate() {
      if (!this.validation) return { valid: true };

      //Do required check
      const value = this.getValue();

      if (this.validation.required) {
         if ((!this.multiSelect && !value) || (this.multiSelect && !value.length)) {
            return {
               valid: false,
               message: "response required",
            };
         }
      }

      return { valid: true };
   }

   async apiLookup({ string }) {
      if (!this.searchMinChars) this.searchMinChars = 1;

      //Hide results if below min lookup length
      if (string.length < this.searchMinChars) {
         this.hide({ selector: `.select-component-results` });

         if (this.browseEnabled && this.browseAlwaysOpen) {
            this.show({ selector: `.select-component-browse` });
         }

         return;
      }

      //Check if in cache first
      let cachedResult = this.getCachedResult({ string });

      //Do nothing if still waiting for a response
      if (cachedResult && cachedResult.status == "sent") return;

      //Else use what's in cache
      if (cachedResult) {
         return this.processApiResults({ results: cachedResult.results, string });
      }

      //Request search from server if not in cache
      if (!cachedResult) {
         const request = {
            string,
            status: "sent",
            results: [],
         };

         this.apiCache.push(request);

         //Add spinner
         this.node.querySelector(`.select-component-input-container`).classList.add("searching");

         //Collate data for server
         const sendData = this.definitionApiParams || {};
         sendData[this.definitionStringParam] = string;

         const response = await stepCore.server.send({
            sendData,
            url: this.definitionApi,
            errorToast: true,
         });

         //Remove spinner
         this.node.querySelector(`.select-component-input-container`).classList.remove("searching");

         if (response.status == "success") {
            //Update cached response
            request.status = "received";
            request.results = response.results;

            //Update string to currently typed value (in case more keystrokes since submit)
            string = this.getInputValue();

            //Check request still valid (user may have backspaced and retyped if slow)
            if (this.isResponseValid({ string })) {
               this.processApiResults({ results: response.results, string });
            }
         }
      }
   }

   getCachedResult({ string }) {
      for (let i = 0; i < this.apiCache.length; i++) {
         const apiCacheItem = this.apiCache[i];
         if (apiCacheItem.status !== "failed" && string.match(new RegExp("^" + apiCacheItem.string))) {
            return apiCacheItem;
         }
      }
      return null;
   }

   isResponseValid({ string }) {
      const currentString = this.getInputValue();
      if (currentString.match(new RegExp("^" + string, "i"))) {
         return true;
      }
   }

   processApiResults({ results, string }) {
      //Sort & filter
      for (let i = 0; i < results.length; i++) {
         const result = results[i];
         //Reset match vars in case re-running
         result.startMatch = 0;
         result.nameMatch = 0;

         //Do name match tests
         let hasNameMatch = 0;
         let hasStartNameMatch = 0;
         const testStartMatch = ({ string, name }) => {
            return name
               .replace(/[^0-9A-Za-z]/g, "")
               .match(new RegExp("^" + string.replace(/[^0-9A-Za-z]/g, "") + ".*", "gi"))
               ? 1
               : 0;
         };

         //Get name
         let name = result[this.definitionApiResponse.label];

         // Check results
         if (
            name
               .toLowerCase()
               .replace(/[^0-9A-Za-z]/g, "")
               .includes(string.replace(/[^0-9A-Za-z]/g, ""))
         ) {
            result.nameMatch = 1;
            hasNameMatch = 1;
            if (testStartMatch({ string, name })) {
               result.startMatch = 1;
               hasStartNameMatch = 1;
            }
         }

         //Sort / filter
         result.include = hasNameMatch;
         if (!hasNameMatch) continue;

         //Calculate score

         //Add score by type
         if (this.definitionApiType == "place") {
            const typeScores = {
               county_authority: 6,
               county_ceremonial: 5,
               country: 5,
               colloquial: 4,
               region: 3,
               health: 2,
               energy: 2,
               ward: 1,
               parish: 1,
               place: 0,
            };

            result.score = typeScores[result.type];
         }

         result.score += hasStartNameMatch * 10;
      }

      //Filter & sort
      const filteredResults = results.filter((o) => o.include);
      filteredResults.sort((a, b) => (a.score < b.score ? 1 : -1));

      //Add to results
      this.renderApiResults({ results: filteredResults, string });
   }

   renderApiResults({ results, string }) {
      this.show({ selector: `.select-component-results` });
      this.mode = "search";

      this.topResult = results[0];

      // console.log(results);
      let markup = ``;
      //Handle no results
      if (!results.length) {
         markup += `
         <div class="select-component-result-none">
            ${this.getWording({
               concept: "no_matches_found",
               defaultText: `No matches found`,
            })}
         </div>`;
      }

      //Handle results
      if (results.length) {
         for (let i = 0; i < results.length; i++) {
            const result = results[i];
            markup += this.renderApiResult({ result, string });
         }
      }

      //Show results
      this.node.querySelector(`.select-component-results`).innerHTML = markup;
   }

   renderApiResult({ result, string }) {
      let key = result[this.definitionApiResponse.key];
      let label = result[this.definitionApiResponse.label];

      //Add match highlight
      label = label.replace(new RegExp(string, "i"), function (string) {
         let followingSpace = label.match(new RegExp(string + " ", "i"));
         return `<b class="${followingSpace ? "space-after" : ""}">${string}</b>`;
      });

      let secondaryLabel = result[this.definitionApiResponse.secondaryLabel] || "";

      if (this.definitionApiType == "place") {
         if (secondaryLabel == "county_authority") secondaryLabel = "Local authority";
         if (secondaryLabel == "county_ceremonial") secondaryLabel = "Ceremonial county";
         if (secondaryLabel == "health") secondaryLabel = "NHS region";
         if (secondaryLabel == "energy") secondaryLabel = "Energy region";
         if (secondaryLabel == "water") secondaryLabel = "Water region";
      }

      let markup = ` 
            <div class="select-component-result ripple selectable select-component-action" data-action="apiResultSelect,apiResultExplore" data-key="${key}" tabindex="0">
                <div class="select-component-result-label">
                     <div class="select-component-result-primary-label">
                        ${label}
                     </div>
                    ${
                       secondaryLabel
                          ? `<div class="select-component-result-secondary-label">${secondaryLabel}</div>`
                          : ""
                    }
                </div> 
            </div>
        `;
      return markup;
   }

   getInputValue() {
      return this.node.querySelector(`.select-component-input`).value.trim();
   }

   async apiResultSelect({ key }) {
      //Wait 1 second
      await new Promise((resolve) => setTimeout(resolve, 500));

      this.selectItem({ item: { key } });
   }

   apiResultExplore({ key }) {
      //Open new window with url
      window.open(`/places/view/${key}`, "_blank");
   }

   renderFilters() {
      if (Object.keys(this.filterOptions).length < 2) {
         return "";
      }

      let markup = `
      
      <div class="select-component-filter-container">`;
      for (const filter of this.filterOptions) {
         markup += `
            <div class="select-component-filter">
               <button class="select-component-filter-label ${
                  this.filters.includes(filter.key) ? `selected` : ``
               } select-component-action" data-action="toggleFilter" data-key="${filter.key}">${filter.label}</button> 
            </div>
         `;
      }

      markup += `
      </div>`;

      return markup;
   }

   toggleFilter({ key }) {
      if (this.filters.includes(key)) {
         this.filters = this.filters.filter((o) => o != key);
      } else {
         this.filters.push(key);
      }
      this.initialize();
   }

   filterData({ items }) {
      if (!this.filters.length) return items;

      const filtered = [];
      for (let i = 0; i < items.length; i++) {
         const item = items[i];

         if (this.filteredMatched({ item })) {
            filtered.push(item);
         }
      }

      return filtered;
   }

   filteredMatched({ item }) {
      for (let i = 0; i < this.filters.length; i++) {
         const filterSet = this.filterOptions.find((f) => f.key == this.filters[i]);

         for (let f = 0; f < filterSet.filters.length; f++) {
            const filter = filterSet.filters[f];
            const itemProperty = item[filter.property];
            if (!itemProperty) return false;
            if (!filter.values.includes(itemProperty)) return false;
         }
      }
      return true;
   }

   renderHeaderButtons() {
      let markup = `
      <div class="select-component-header-buttons">
      `;
      for (let i = 0; i < this.headerButtons.length; i++) {
         const button = this.headerButtons[i];
         markup += `
         <button class="icon-${button.icon} select-component-action" data-action="headerButton" data-key="${button.key}">${button.label}</button>
         `;
      }

      markup += `
      </div>`;

      return markup;
   }

   headerButton({ key }) {
      //Fire any external listener events
      this.fireExternalListenerEvents({ eventTypes: ["headerButton"], data: key });
   }

   renderSelectionPanel() {
      let show = true;
      if (this.hideEmptySelectionPanel && (!this.value || !this.value.length)) show = false;

      let toggleClick = !this.searchEnabled && this.multiSelect;

      let markup = `
      <div class="select-component-selection-panel ${show ? `` : `hide`} ${
         toggleClick ? `select-component-action show-drop-arrow" data-action="selectionToggle"` : `"`
      }>
         <div class="select-component-selection-panel-items">`;

      for (let i = 0; i < this.value.length; i++) {
         const item = this.value[i];
         const label = this.renderItem({ item });

         markup += `
            <div class="select-component-selection-panel-item">
               ${label}
               <button class="select-component-item-deselect select-component-action" data-action="deselect" data-key="${item}"></button>
            </div>
         `;
      }

      if (!this.value.length && !this.searchEnabled) {
         markup += `<div class="select-component-selection-panel-placeholder">`;

         let placeHolder = this.getWording({
            id: this.placeholderId,
            concept: this.placeholderConcept,
            defaultConcept: "no_selection",
            text: this.placeholder,
            defaultText: `No selection`,
         });

         if (placeHolder) {
            markup += placeHolder;
         }
         markup += `</div>`;
      }

      markup += `</div>
         <div class="select-component-selection-panel-buttons ${this.showSubmitButton ? "" : "hide"}">
            <button class="round green icon-ok select-component-submit select-component-action" data-action="submit"></button>
         </div>
      </div>
      `;

      return markup;
   }

   renderChecklist({}) {
      let markup = `
      <div class="select-component-checklist-container">
      `;

      for (let i = 0; i < this.dataTree.length; i++) {
         const item = this.dataTree[i];

         let isSelected = this.value && this.value.includes(item.key);

         if (item.default && (!this.value || (this.multiSelect && !this.value.length))) {
            isSelected = true;

            //Where no value supplied, set as field value
            if (this.value == undefined) {
               if (this.multiSelect) {
                  this.value.push(item.key);
               } else {
                  this.value = item.key;
               }
            }
         }

         markup += `
         <div class="select-component-checklist-item ${
            isSelected ? "selected" : ""
         } select-component-action" data-action="checklistClick" data-key="${item.key}">
            ${this.renderItem({ item: item.key })}
         </div>
         `;
      }

      markup += `
      </div>`;
      return markup;
   }

   renderItem({ item }) {
      const itemDefinition = this.getItemDefinition({ key: item });
      let label = `[Error: ${item} not found]`;
      if (itemDefinition) {
         label = itemDefinition.name || itemDefinition.label || itemDefinition.key;

         if (!this.resultDisplayFunction) {
            if (itemDefinition.wordings) {
               let bestWording;
               let bestScore = -1;
               for (let w = 0; w < itemDefinition.wordings.length; w++) {
                  const wording = itemDefinition.wordings[w];
                  if (wording.score > bestScore || (!wording.score && !bestWording)) {
                     bestScore = wording.score || -1;
                     bestWording = wording;
                  }
               }
               label = bestWording.wording;
            }
         }

         if (this.resultDisplayFunction) {
            label = this.resultDisplayFunction({ item: itemDefinition.item });
         }
      }

      label = this.resultDisplayFunction ? label : this.sanitizeDisplay({ text: label });

      return label;
   }

   renderBoolean({}) {
      let label = this.getWording({
         id: this.labelId,
         concept: this.labelConcept,
         text: this.label,
      });

      let markup = `
      <input type="checkbox" id="toggle-${this.componentId}" ${this.value ? "checked " : ""}>
      <label for="toggle-${this.componentId}" class="select-component-action" data-action="booleanClick">
         <div class="select-component-toggle"></div>
         <div class="select-component-toggle-label">${label}</div> 
      </label>`;

      return markup;
   }

   refreshSelectionPanel() {
      const panel = this.node.querySelector(`.select-component-selection-panel`);
      const markup = this.renderSelectionPanel();
      panel.outerHTML = markup;
   }

   browseClickOut({ event }) {
      if (this.browseAlwaysOpen) return;

      //Ignore click out in input field
      if (event.target.classList.contains("select-component-input")) return;

      this.hide({ selector: `.select-component-browse` });
      this.hide({ selector: `.select-component-results` });
   }

   selectionToggle({}) {
      this.displayBrowse({ dataTree: this.dataTree, direction: "forward" });
   }

   showInvalid({ message, scrollTo }) {
      this.node.classList.add("invalid");
      this.invalid = true;

      this.node.querySelector(".form-element-invalid-message").innerHTML = message;

      if (scrollTo) {
         this.scrollTo({});
      }
   }

   clearInvalid({}) {
      this.node.classList.remove("invalid");
      this.node.querySelector(".form-element-invalid-message").innerHTML = "";
      this.invalid = false;
   }

   overlayClick({}) {
      this.focus({});
   }

   setValue({ value }) {
      //This function is going to work yet in most contexts...
      if (this.type == "picker") {
         if (!this.multiSelect) {
            //Handle deselection
            if (!value && this.value) {
               this.deselect({ key: this.value, noEvent: true });
            }

            //Handle selection
            if (value) {
               this.selectItem({ item: { key: value }, noEvent: true });
            }
         }

         if (this.multiSelect) {
            this.value = value;
            this.refreshSelectionPanel();
         }
      }

      this.value = value;
   }
}
