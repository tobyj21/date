"use strict";

class uiComponent {
   constructor({
      node,
      insert, //before, after, append, prepend, modal, tooltip
      insertClass,
      parent,
      externalListeners,
      clickOutAction, // warn, remove, hide, or provide function
      blockTooltipInitialize, //Delay may be necessary if content of tooltip isn't present immediately on render
   }) {
      this.parent = parent;
      this.isModal = insert == "modal";
      this.listeners = [];

      if (!node && insert != "modal") new Error(`Invalid node provided for ${this.constructor.name} component`);

      //Set container node
      this.node = typeof node === "string" ? document.querySelector(node) : node;
      //Where no node, don't create in DOM
      if (!this.node && !insert) {
         return;
      }

      if (insert == "tooltip") this.targetNode = node;

      //If insert type, create new node
      if (insert) this.node = this.insertNode({ insertClass, node, insert });
      //Otherwise add insertClass to existing node
      if (!insert && insertClass) {
         let classes = insertClass.split(" ").filter((c) => !!c);
         for (let c = 0; c < classes.length; c++) {
            const item = classes[c];
            this.node.classList.add(item);
         }
      }

      this.initProperties = { insert, insertClass };

      // Create unique identifier for instance and add to node
      this.componentId = this.generateKey({ length: 6 });
      this.node.setAttribute("data-component-id", this.componentId);

      this.externalListeners = externalListeners;

      //Add click-out listener
      this.clickOutAction = clickOutAction;
      if (clickOutAction) this.addClickOutListener({ action: clickOutAction });

      if (insert == "tooltip" && !blockTooltipInitialize) {
         this.initializeTooltip();
      }
   }

   insertNode({ insertClass, node, insert }) {
      if (insert == "tooltip") {
         insertClass = `ui-tooltip ${insertClass || ""}`;
      }

      //Do modal insert
      if (insert == "modal") {
         const tempElement = document.createElement("div");
         //Add class to modal
         tempElement.classList.add("step-modal-container");

         //Where modal class provided, add to modal
         let modalClass = ``;
         if (insertClass && insertClass.includes("modal-")) {
            const insertClasses = insertClass.split(" ");
            modalClass = insertClasses.find((c) => c.startsWith("modal-"));
            insertClass = insertClasses.filter((c) => !c.startsWith("modal-")).join(" ");
         }

         tempElement.innerHTML = ` 
         <div class="step-modal-overlay ${modalClass}">
            <div class="step-modal-content ${insertClass}" role="dialog" aria-modal="true"></div>
         </div>`;
         document.body.appendChild(tempElement);

         document.body.classList.add("locked");

         this.modalVisible = true;

         return tempElement.querySelector(".step-modal-content");
      }

      let tempContainer = document.createElement("div");
      tempContainer.innerHTML = `<div class="${insertClass || ""}"></div>`;

      let insertedNode = tempContainer.firstChild;

      if (!node) {
         console.log(`Error:  ${this.constructor.name}`);
      }

      switch (insert) {
         case "before":
            node.parentNode.insertBefore(insertedNode, node);
            break;
         case "after":
            node.parentNode.insertBefore(insertedNode, node.nextSibling);
            break;
         case "append":
            node.appendChild(insertedNode);
            break;
         case "prepend":
            node.insertBefore(insertedNode, node.firstChild);
            break;
         case "tooltip":
            document.body.appendChild(insertedNode);
            break;
         default:
            throw new Error("Invalid insertType provided");
      }

      return insertedNode;
   }

   insertMarkup({ markup, node, insert = "append" }) {
      let tempContainer = document.createElement("div");
      tempContainer.innerHTML = markup;

      let insertedNodes = Array.from(tempContainer.childNodes);

      switch (insert) {
         case "before":
            insertedNodes.forEach((childNode) => {
               node.parentNode.insertBefore(childNode, node);
            });
            break;
         case "after":
            insertedNodes.reverse().forEach((childNode) => {
               node.parentNode.insertBefore(childNode, node.nextSibling);
            });
            break;
         case "append":
            insertedNodes.forEach((childNode) => {
               node.appendChild(childNode);
            });
            break;
         case "prepend":
            insertedNodes.reverse().forEach((childNode) => {
               node.insertBefore(childNode, node.firstChild);
            });
            break;
         default:
            throw new Error("Invalid insertType provided");
      }

      return insertedNodes;
   }

   generateKey({ length = 5 }) {
      let result = "";
      while (result.length < length) {
         result += Math.random().toString(36).substring(2); // Remove "0."
      }
      return result.substring(0, length); // Trim to exact length
   }

   async addClickOutListener({ action }) {
      //Wait for any other listeners to be added
      await new Promise((resolve) => setTimeout(resolve, 1));

      //Where modal, treat click out as overlay click
      if (this.isModal) {
         this.modalClickOutHandler = this.modalClickOutHandler.bind(this);
         this.node.parentNode.addEventListener("click", this.modalClickOutHandler);

         this.listeners.push({
            function: this.genericClickOut,
            events: ["modalClickOut"],
         });
         return;
      }

      //Else do proper click out

      if (!this.listeners.some((item) => item.events.includes("clickOut"))) {
         //Add listener
         this.clickOutHandler = this.clickOutHandler.bind(this);
         document.addEventListener("click", this.clickOutHandler);
      }

      //Add action
      this.listeners.push({
         function: this.genericClickOut,
         events: ["clickOut"],
      });

      //Add action data to node
      if (!this.eventListenerClass) {
         this.eventListenerClass = this.generateKey({ length: 6 });
      }
      if (!this.node.classList.contains(this.eventListenerClass)) {
         this.node.classList.add(this.eventListenerClass);
      }

      //Get action data attribute
      let actionAttribute = this.node.getAttribute("data-action");
      if (actionAttribute) actionAttribute += ",genericClickOut";
      if (!actionAttribute) actionAttribute = "genericClickOut";
      this.node.setAttribute("data-action", actionAttribute);
   }

   registerListeners({ className, listeners }) {
      this.eventListenerClass = className;
      this.listeners = listeners;

      //Click events
      if (this.listeners.some((item) => item.events.includes("click"))) {
         this.clickHandler = this.clickHandler.bind(this);
         this.node.addEventListener("click", this.clickHandler);
      }

      //Click out events
      if (this.listeners.some((item) => item.events.includes("clickOut"))) {
         this.clickOutHandler = this.clickOutHandler.bind(this);
         document.addEventListener("click", this.clickOutHandler);
      }

      //Modal click out events
      if (this.listeners.some((item) => item.events.includes("modalClickOut"))) {
         this.modalClickOutHandler = this.modalClickOutHandler.bind(this);
         this.node.parentNode.addEventListener("click", this.modalClickOutHandler);
      }

      const keyPressEvents = ["enter", "backspace", "keyDown", "keyUp"];

      //Keydown events
      if (this.listeners.some((item) => item.events.some((event) => keyPressEvents.includes(event)))) {
         this.keyDownHandler = this.keyDownHandler.bind(this);
         this.node.addEventListener("keydown", this.keyDownHandler);
      }

      //Keyup events
      if (this.listeners.some((item) => item.events.some((event) => keyPressEvents.includes(event)))) {
         this.keyUpHandler = this.keyUpHandler.bind(this);
         this.node.addEventListener("keyup", this.keyUpHandler);
      }

      //Input events (any change to input elements)
      if (this.listeners.some((item) => item.events.includes("input"))) {
         this.inputHandler = this.inputHandler.bind(this);
         document.addEventListener("input", this.inputHandler);
      }

      //Select change events
      if (this.listeners.some((item) => item.events.includes("change"))) {
         this.changeHandler = this.changeHandler.bind(this);
         document.addEventListener("change", this.changeHandler);
      }

      //Focus events
      if (this.listeners.some((item) => item.events.includes("focus"))) {
         this.focusHandler = this.focusHandler.bind(this);
         document.addEventListener("focus", this.focusHandler, true);
      }

      //Focus out events
      if (this.listeners.some((item) => item.events.includes("blur"))) {
         this.blurHandler = this.blurHandler.bind(this);
         document.addEventListener("blur", this.blurHandler, true);
      }

      //Window messages (from extension)
      if (this.listeners.some((item) => item.events.includes("message"))) {
         this.windowEventHandler = this.windowEventHandler.bind(this);
         window.addEventListener("message", this.windowEventHandler);
      }
   }

   async clickHandler(event) {
      let node = event.target;

      //Wait 1ms (allowing any clickOut events to fire first)
      await new Promise((resolve) => setTimeout(resolve, 1));

      //Test same component
      if (!node.closest(`[data-component-id="${this.componentId}"]`)) return;

      //Test if listener exists on clicked node
      let matchedNode = node.matches(`.${this.eventListenerClass}`);
      if (!matchedNode) {
         matchedNode = node.closest(`.${this.eventListenerClass}`);
         node = matchedNode;
      }
      if (!matchedNode) return;

      this.handleEvent({ node, type: "click", alt: event.altKey, ctrl: event.ctrlKey, shift: event.shiftKey });

      //Ripple effect
      if (node.classList.contains("ripple")) {
         const rect = node.getBoundingClientRect();
         const x = event.clientX - rect.left;
         const y = event.clientY - rect.top;

         this.insertMarkup({
            markup: `<span class="ripple-animation" style="left: ${x}px; top: ${y}px"/></span>`,
            node,
         });
      }
   }

   modalClickOutHandler(event) {
      if (!event.target.classList.contains("step-modal-overlay")) return;
      for (let i = 0; i < this.listeners.length; i++) {
         const item = this.listeners[i];
         if (!item.events.includes("modalClickOut")) continue;
         const matchedFunction = item.function.bind(this);
         matchedFunction({ event });
      }
   }

   clickOutHandler(event) {
      let clickedNode = event.target;
      const listenerNodeId = this.componentId;

      //Get matching function
      for (let i = 0; i < this.listeners.length; i++) {
         const item = this.listeners[i];
         if (!item.events.includes("clickOut")) continue;

         //Check if node exists with click out action
         let targetNode = document.querySelector(
            `[data-component-id="${this.componentId}"] [data-action="${item.function.name}"]`
         );

         if (!targetNode) {
            targetNode = document.querySelector(
               `[data-component-id="${this.componentId}"][data-action="${item.function.name}"]`
            );
         }

         if (!targetNode) continue;

         //Then test if
         if (!targetNode.contains(clickedNode)) {
            // Clicked outside the parent node detected: call function
            const matchedFunction = item.function.bind(this);
            matchedFunction({ event });
         }
      }
   }

   keyDownHandler(event) {
      let node = event.target;

      //Get matching function
      for (let i = 0; i < this.listeners.length; i++) {
         const item = this.listeners[i];
         if (!item) continue;
         if (!item.events.includes("keyDown")) continue;

         //Test same component (unless global scoped)
         if (!item.global) {
            if (!node.closest(`[data-component-id="${this.componentId}"]`)) return;

            //Test if listener exists on in-focus node
            let matchedNode = node.matches(`.${this.eventListenerClass}`);
            if (!matchedNode) continue;
            const actions = node.getAttribute("data-action").split(",");
            if (!actions.includes(item.function.name)) continue;
         }

         //Do key-code specific filters
         if (!this.isKeyRelevant({ keyFilter: item.keyFilter, keyCode: event.keyCode })) continue;

         //Call function
         const matchedFunction = item.function.bind(component);
         matchedFunction({ event });
      }
   }

   keyUpHandler(event) {
      event.stopPropagation(); //Bugfix: stop propagation to prevent keyup event from triggering multiple times
      let node = event.target;

      //Get matching function
      for (let i = 0; i < this.listeners.length; i++) {
         const item = this.listeners[i];
         if (!item.function) continue;

         //Filter key type as appropriate

         //Test same component (unless global scoped)
         if (!item.global) {
            if (!node.closest(`[data-component-id="${this.componentId}"]`)) continue;

            //Test if listener exists on in-focus node
            let matchedNode = node.matches(`.${this.eventListenerClass}`);
            if (!matchedNode) continue;
            const actions = node.getAttribute("data-action").split(",");
            if (!actions.includes(item.function.name)) continue;
         }

         //Enter press
         if (event.keyCode == 13) {
            if (item.events.includes("enter")) {
               this.handleEvent({ node, type: "enter", alt: event.altKey, ctrl: event.ctrlKey, shift: event.shiftKey });
            }
            continue;
         }

         //Backspace press
         if (event.keyCode == 8) {
            if (item.events.includes("backspace")) {
               this.handleEvent({
                  node,
                  type: "backspace",
                  alt: event.altKey,
                  ctrl: event.ctrlKey,
                  shift: event.shiftKey,
               });
            }
            continue;
         }

         //Filter other keys
         if (!item.events.includes("keyUp")) continue;

         //Ignore alt key press
         if (event.key === "Alt" || event.code === "AltLeft" || event.code === "AltRight") return;

         //Ignore ctrl key press
         if (event.key === "Control" || event.code === "ControlLeft" || event.code === "ControlRight") return;

         //Ignore shift key press
         if (event.key === "Shift" || event.code === "ShiftLeft" || event.code === "ShiftRight") return;

         //If other keys, return generic keypress
         //Get matching function
         for (let i = 0; i < this.listeners.length; i++) {
            const item = this.listeners[i];
            if (!item.function) continue;

            if (!item.events.includes("keyUp")) continue;

            //Do key-code specific filters
            if (!this.isKeyRelevant({ keyFilter: item.keyFilter, keyCode: event.keyCode })) continue;

            //Call function
            const matchedFunction = item.function.bind(this);
            matchedFunction({ event });
         }
      }
   }

   changeHandler(event) {
      let node = this.testHandlerMatch({ event });
      if (!node) return;
      this.handleEvent({ node, type: "change", event });
   }

   inputHandler(event) {
      let node = this.testHandlerMatch({ event });
      if (!node) return;

      this.handleEvent({ node, type: "input", event });
   }

   focusHandler(event) {
      let node = this.testHandlerMatch({ event });
      if (!node) return;
      this.handleEvent({ node, type: "focus", event });
   }

   blurHandler(event) {
      let node = this.testHandlerMatch({ event });
      if (!node) return;
      this.handleEvent({ node, type: "blur", event });
   }

   testHandlerMatch({ event }) {
      let node = event.target;
      //Test same component
      if (!node.closest(`[data-component-id="${this.componentId}"]`)) return;
      //Test if listener exists on changed node
      let matchedNode = node.matches(`.${this.eventListenerClass}`);
      if (!matchedNode) {
         matchedNode = node.closest(`.${this.eventListenerClass}`);
         node = matchedNode;
      }
      if (!matchedNode) return;
      return node;
   }

   windowEventHandler(event) {
      if (!event.data) return;
      const message = event.data;

      //Check if this component still exists
      if (
         !document.querySelector(`[data-component-id="${this.componentId}"]`) ||
         !document.querySelector(`[data-component-id="${this.componentId}"]`).hasChildNodes()
      ) {
         return;
      }

      //Check if message is for this component
      if (message.key && message.key !== this.componentId) return;

      //Get matching function
      for (const key in this.listeners) {
         const item = this.listeners[key];
         if (!item.function) continue;

         if (!item.events.includes("message")) continue;
         if (item.function.name == message.type) {
            //Call function
            const matchedFunction = item.function.bind(this);
            matchedFunction(message);
         }
      }
   }

   childEventHandler({ action, data, sourceObject }) {
      //Trigger any listeners
      if (this.listeners) {
         for (let i = 0; i < this.listeners.length; i++) {
            const listener = this.listeners[i];
            if (!listener || !listener.function) continue;
            if (listener.events.includes("childEvent") && listener.function.name == action) {
               const matchedFunction = listener.function.bind(this);
               matchedFunction({ data, sourceObject });
               if (listener.stopPropagation) return;
            }
         }
      }

      //Pass event to parent
      if (this.parent && typeof this.parent.childEventHandler === "function") {
         this.parent.childEventHandler({ action, data, sourceObject });
      }
   }

   propertySearch({ key, objectName }) {
      if ((!objectName || this.constructor.name == objectName) && typeof this[key] !== "undefined") {
         return this[key];
      }

      //Pass event to parent
      if (this.parent && typeof this.parent.childEventHandler === "function") {
         return this.parent.propertySearch({ key, objectName });
      }
   }

   isKeyRelevant({ keyFilter, keyCode }) {
      if (!keyFilter) return true;
      if (
         (keyFilter.includes("enter") && keyCode === 13) ||
         (keyFilter.includes("backspace") && keyCode === 8) ||
         keyFilter.includes(keyCode)
      )
         return true;
   }

   handleEvent({ node, type, alt, ctrl, shift, event }) {
      const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);

      //Get all data attributes from matched node
      const dataAttributes = {};
      const elementAttributes = node.dataset;
      for (const key in elementAttributes) {
         dataAttributes[key] = elementAttributes[key];
      }

      const actions = dataAttributes.action.split(",");
      if (!actions.length) return console.error("No action found for clicked node");

      //Get matching function
      for (const key in this.listeners) {
         const item = this.listeners[key];
         if (!item.function) continue;

         if (!alt && !ctrl && !item.events.includes(type)) continue;
         if (alt && !item.events.includes(`alt${capitalizedType}`)) continue;
         if (ctrl && !item.events.includes(`ctrl${capitalizedType}`)) continue;
         if (shift && !item.events.includes(`shift${capitalizedType}`)) continue;
         if (actions.includes(item.function.name)) {
            //Call function
            dataAttributes.event = event;
            dataAttributes.clickedNode = node;
            dataAttributes.alt = alt;
            dataAttributes.ctrl = ctrl;
            dataAttributes.shift = shift;
            const matchedFunction = item.function.bind(this);
            matchedFunction(dataAttributes);
         }
      }
   }

   async remove() {
      //Remove event listeners
      if (this.listeners) {
         if (this.listeners.some((item) => item.events.includes("click"))) {
            //Click events
            this.node.removeEventListener("click", this.clickHandler);
         }

         //Click out events
         if (this.listeners.some((item) => item.events.includes("clickOut"))) {
            document.removeEventListener("click", this.clickOutHandler);
         }

         //Modal click out events
         if (this.listeners.some((item) => item.events.includes("modalClickOut"))) {
            this.node.parentNode.removeEventListener("click", this.modalClickOutHandler);
         }

         const keyPressEvents = ["enter", "backspace", "keyDown", "keyUp"];
         //Keydown events
         if (this.listeners.some((item) => item.events.some((event) => keyPressEvents.includes(event)))) {
            this.node.removeEventListener("keydown", this.keyDownHandler);
         }

         //Keyup events
         if (this.listeners.some((item) => item.events.some((event) => keyPressEvents.includes(event)))) {
            this.node.removeEventListener("keyup", this.keyUpHandler);
         }

         //Window messages (from extension)
         if (this.listeners.some((item) => item.events.includes("message"))) {
            window.removeEventListener("message", this.windowEventHandler);
         }
      }

      //Where not inserted node, reset classes
      if (!this.initProperties.insert && this.initProperties.insertClass) {
         let classes = this.initProperties.insertClass.split(" ").filter((c) => !!c);
         for (let c = 0; c < classes.length; c++) {
            const item = classes[c];
            this.node.classList.remove(item);
         }
      }

      //Where not inserted, clear node HTML
      if (!this.initProperties.insert) {
         this.node.innerHTML = "";
         return;
      }

      //Where inserted, remove node
      if (this.isModal) {
         const modalContainer = this.node.parentNode.parentNode;
         modalContainer.classList.add("closing");
         await new Promise((resolve) => setTimeout(resolve, 400));
         this.node.parentNode.parentNode.remove();

         //Remove modal lock
         document.body.classList.remove("locked");
      } else {
         this.node.remove();
      }
   }

   getNode(selector) {
      return this.node.querySelector(selector);
   }

   getAllNodes(selector) {
      return this.node.querySelectorAll(selector);
   }

   async show({ selector, node, animate, selectAll }) {
      if (selectAll) {
         node = this.getAllNodes(selector);
         if (!node) return;
         for (let i = 0; i < node.length; i++) {
            const item = node[i];
            this.show({ node: item, animate });
         }
         return;
      }

      if (selector) node = this.getNode(selector);
      if (!node) return;

      node.classList.remove("hide");
      if (animate) {
         if ((animate + "").includes("fade-in-")) {
            node.classList.remove("hide-placeholder");
            node.classList.add(animate);
            await this.wait(600);
            node.classList.remove(animate);
            return;
         }

         node.classList.add("fade-in");
         await this.wait(600);
         node.classList.remove("fade-in");
         node.classList.remove("hide-placeholder");
      }
   }

   async hide({ selector, node, animate, selectAll }) {
      if (selectAll) {
         node = this.getAllNodes(selector);
         if (!node) return;
         for (let i = 0; i < node.length; i++) {
            const item = node[i];
            this.hide({ node: item, animate });
         }
         return;
      }

      if (selector) node = this.getNode(selector);
      if (!node) return;

      if (animate) {
         node.classList.add("fade-out");
         await new Promise((resolve) => setTimeout(resolve, 600));
      }

      node.classList.add("hide");

      if (animate) node.classList.remove("fade-out");
   }

   addClass({ node, selector, selectAll, className }) {
      if (selectAll) {
         node = this.getAllNodes(selector);
         if (!node) return;
         for (let i = 0; i < node.length; i++) {
            const item = node[i];
            item.classList.add(className);
         }
         return;
      }

      if (selector) node = this.getNode(selector);
      if (!node) return;
      node.classList.add(className);
   }

   removeClass({ node, selector, selectAll, className }) {
      if (selectAll) {
         node = this.getAllNodes(selector);
         if (!node) return;
         for (let i = 0; i < node.length; i++) {
            const item = node[i];
            item.classList.remove(className);
         }
         return;
      }

      if (selector) node = this.getNode(selector);
      if (!node) return;
      node.classList.remove(className);
   }

   toggleClass({ node, selector, className }) {
      if (selector) node = this.getNode(selector);
      if (!node) return;
      node.classList.toggle(className);
   }

   fireExternalListenerEvents({ eventTypes, data, sourceObject }) {
      if (!this.externalListeners) return;
      for (let i = 0; i < this.externalListeners.length; i++) {
         const listener = this.externalListeners[i];
         if (eventTypes.includes(listener.type)) {
            this.parent.childEventHandler({
               action: listener.action,
               element: this,
               data,
               sourceObject: sourceObject || this,
            });
         }
      }
   }

   getAncestorObject({ objectType }) {
      //Do array tests
      if (Array.isArray(objectType)) {
         if (objectType.includes(this.constructor.name)) return this;
      } else {
         //Do single value tests
         if (this.constructor.name == objectType) return this;
      }

      return this.parent.getAncestorObject({ objectType });
   }

   getAncestorProperty({ property }) {
      if (this[property]) return this[property];
      if (!this.parent) return null;
      return this.parent.getAncestorProperty({ property });
   }

   genericClickOut() {
      if (this.clickOutAction == "warn") {
         if (confirm("Are you sure you want to close this?")) {
            this.remove();
         }
      }

      if (this.clickOutAction == "remove") {
         this.remove();
         return;
      }

      if (this.clickOutAction == "hide") {
         this.hideModal();
         return;
      }

      if (typeof this.clickOutAction == "function") {
         const clickAction = this.clickOutAction.bind(this.parent);
         clickAction({});
         return;
      }
   }

   expandAccordion({ node }) {
      node.classList.remove("hide");
      const currentHeight = node.scrollHeight + "px";
      node.style.maxHeight = currentHeight;

      setTimeout(() => {
         node.style.maxHeight = "none";
      }, 500);
   }

   minimizeAccordion({ node }) {
      node.classList.add("hide");
      const currentHeight = node.scrollHeight + "px";
      node.style.maxHeight = currentHeight;
   }

   async hideModal() {
      const modalContainer = this.node.parentNode.parentNode;
      modalContainer.classList.add("closing");
      modalContainer.classList.add("hidden");
      this.modalVisible = false;

      //Remove modal lock
      document.body.classList.remove("locked");
   }

   unhideModal() {
      const modalContainer = this.node.parentNode.parentNode;
      modalContainer.classList.remove("closing");
      modalContainer.classList.remove("hidden");
      this.modalVisible = true;

      //Remove modal lock
      document.body.classList.remove("locked");
   }

   initializeTooltip() {
      let tooltip = this.node;
      const target = this.targetNode;

      stepCore.floatingUI.autoUpdate(target, tooltip, () => {
         stepCore.floatingUI
            .computePosition(target, tooltip, {
               placement: "bottom",
               middleware: [
                  //  stepCore.floatingUI.shift(),
                  stepCore.floatingUI.offset(10),
                  stepCore.floatingUI.flip(),
                  stepCore.floatingUI.size({
                     apply({ availableWidth, availableHeight, elements }) {
                        //Bug happening with availableWidth going to zero. Put in minimum as bugfix
                        availableWidth = Math.max(availableWidth, window.innerWidth - 30);

                        Object.assign(elements.floating.style, {
                           maxWidth: `${availableWidth}px`,
                           maxHeight: `${availableHeight}px`,
                        });
                     },
                  }),
               ],
            })
            .then(({ x, y, placement, middlewareData }) => {
               // Calculate the maximum allowed X position to keep the tooltip within the viewport
               const maxAllowedX = document.body.offsetWidth - tooltip.offsetWidth;

               // Ensure the tooltip is within the visible viewport
               x = Math.min(x, maxAllowedX);

               Object.assign(tooltip.style, {
                  left: `${x}px`,
                  top: `${y}px`,
               });

               const side = placement.split("-")[0];

               if (side === "top") {
                  tooltip.classList.add("top");
               } else {
                  tooltip.classList.remove("top");
               }
            });
      });
   }

   scrollTo({ scrollingObject = window, targetNode = this.node, offset }) {
      //Get top of target node
      let targetTop = targetNode.getBoundingClientRect().top;
      if (offset) targetTop + offset;

      scrollingObject.scrollBy({
         top: targetTop,
         behavior: "smooth",
      });
   }

   checkVisibility({ node }) {
      const rect = node.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;

      let bottomClipped = rect.bottom > windowHeight;
      let bottomClipAmount = bottomClipped ? rect.bottom - windowHeight : 0;
      let bottomVisibleAmount = bottomClipped ? rect.height - bottomClipAmount : 0;

      let topClipped = rect.top < 0;
      let topClipAmount = topClipped ? Math.abs(rect.top) : 0;
      let topVisibleAmount = topClipped ? rect.height - topClipAmount : 0;

      return {
         bottomClipped,
         bottomClipAmount,
         bottomVisibleAmount,
         topClipped,
         topClipAmount,
         topVisibleAmount,
      };
   }

   async wait(duration) {
      await new Promise((resolve) => setTimeout(resolve, duration));
   }

   async addSpinner({ node, overlay, animate }) {
      if (!node) node = this.node;
      let markup = `<div class="circular-loading-overlay ${animate ? "spinner-scale-in" : ""}"></div>`;
      if (overlay) {
         markup = `<div class="circular-loading-overlay-container">${markup}</div>`;
         node.classList.add("circular-loading-parent");
      }
      this.insertMarkup({ markup, node });

      if (animate) {
         await this.wait(200);
         this.getNode(".circular-loading-overlay").classList.remove("spinner-scale-in");
      }
   }

   async removeSpinner({ node, animate }) {
      if (!node) node = this.node;
      let spinner = node.querySelector(":scope > .circular-loading-overlay");
      if (!spinner) spinner = node.querySelector(":scope > .circular-loading-overlay-container");
      if (!spinner) return;

      if (animate) {
         const spinnerNode = spinner.classList.contains("circular-loading-overlay")
            ? spinner
            : spinner.querySelector(".circular-loading-overlay");
         spinnerNode.classList.add("spinner-scale-out");
         await this.wait(600);
      }

      try {
         node.removeChild(spinner);
         node.classList.remove("circular-loading-parent");
      } catch (error) {}
   }

   getWording({ id, definitionId, concept, defaultConcept, text, defaultText, capitalize }) {
      let wording = ``;

      //Get wording module
      let wordingModule = this.getAncestorProperty({ property: "wordingModule" });

      //Use wordings module if available
      if (wordingModule && (id || concept || defaultConcept || definitionId)) {
         wording = wordingModule.get({
            id,
            concept: concept ? concept : !id && !definitionId ? defaultConcept : null,
            definitionId,
            languageId: this.languageId,
            audience: this.audience,
            returnText: true,
            removeGlossary: true,
         });
         if (wording) {
            if (capitalize && this.languageId == 2112) {
               return capitalize(wording);
            }
            return wording;
         }
      }

      if (text) {
         if (capitalize && this.languageId == 2112) {
            return capitalize(text);
         }
         return text;
      }
      if (defaultText) {
         if (capitalize && this.languageId == 2112) {
            return capitalize(defaultText);
         }
         return defaultText;
      }
      return "";

      function capitalize(string) {
         if (!string) return string;
         return string.charAt(0).toUpperCase() + string.slice(1);
      }
   }
}

class dialogComponent extends uiComponent {
   constructor({
      parent,
      heading,
      text,
      textInput,
      textInputValue,
      validation,
      buttons,
      icon,
      allowClickOut,
      externalListeners,
      insertClass,
   }) {
      super({ insert: "modal", parent, externalListeners, insertClass });

      this.validation = validation;
      this.buttons = buttons;
      this.render({ heading, text, textInput, textInputValue, buttons, icon });

      const listeners = [
         {
            function: this.selection,
            events: ["click", "enter"],
         },
      ];

      if (allowClickOut) {
         listeners.push({
            function: this.remove,
            events: ["modalClickOut"],
         });
      }

      this.registerListeners({
         className: "dialog-action",
         listeners,
      });
   }

   render({ heading, text, textInput, textInputValue, buttons, icon }) {
      let markup = ``;

      if (heading) {
         markup += `<div class="step-dialog-heading icon-${icon}">${heading}</div>`;
      }
      if (text) {
         markup += `<div class="step-dialog-text">${text}</div>`;
      }

      if (textInput) {
         markup += `
         <div class="step-dialog-text-input">
            <input type="text" value="${textInputValue ? textInputValue : ""}" />
         </div>`;
      }

      if (buttons) {
         for (let i = 0; i < buttons.length; i++) {
            const button = buttons[i];
            markup += `
            <button class="step-dialog-button icon-${button.icon} ${
               button.class ? button.class : ""
            } dialog-action" data-action="selection" data-key="${button.key}">
               ${button.label}
            </button>
            `;
         }
      }

      this.node.innerHTML = markup;
   }

   selection({ key }) {
      const buttonConfig = this.buttons.find((button) => button.key == key);
      if (buttonConfig.validate) {
         if (this.validation.required && !this.getValue()) {
            return stepCore.toast({
               type: "error",
               duration: 4000,
               heading: "This field is required",
            });
         }
      }

      const value = this.getValue();
      this.fireExternalListenerEvents({ eventTypes: ["dialogSelection"], data: { key, value } });
      this.remove();
   }

   getValue() {
      if (this.getNode("input")) {
         return this.getNode("input").value.trim();
      }
   }
}

module.exports = {
   uiComponent,
   dialogComponent,
};
