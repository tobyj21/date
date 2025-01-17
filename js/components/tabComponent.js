"use strict";

class tabComponent extends uiComponent {
   constructor({
      node,
      insert,
      insertClass,
      parent,
      menuIcons,
      tabs, // [{key: "", label: "", icon: "", href: "", className: "", content: ""}]
      activeTab,
      style = "panelBlock", // menuBlock | panelBlock
      externalListeners,
   }) {
      super({ node, insert, insertClass, parent, externalListeners });

      this.tabs = tabs;
      this.menuIcons = menuIcons;
      this.style = style;

      this.activeTab = activeTab || tabs[0].key || null;

      this.render({});

      // Register listeners
      this.registerListeners({
         className: "tab-component-action",
         listeners: [{ function: this.openTab, events: ["click", "enter"] }],
      });
   }

   render({}) {
      let markup = `
      <div class="tab-panel-container ${this.style}">
            <div class="tab-panel-menu">`;

      for (let i = 0; i < this.tabs.length; i++) {
         const tab = this.tabs[i];

         if (tab.href) {
            markup += `<a href="${tab.href}" class="tab-panel-button">`;
         } else {
            markup += `<button class="tab-panel-button ${this.activeTab == tab.key ? "active" : ""} ${
               this.menuIcons ? "has-icon" : ""
            } tab-component-action" data-action="openTab" data-key="${tab.key}">`;
         }

         if (this.menuIcons) {
            markup += ` 
            <div class="tab-panel-button-icon icon-${tab.icon}"></div>`;
         }

         markup += `  
         <div class="tab-panel-button-label">${tab.label}</div>
         `;

         if (tab.href) {
            markup += `</a>`;
         } else {
            markup += `</button>`;
         }
      }

      markup += ` 
            </div>
            <div class="tab-panel-content">`;

      for (let i = 0; i < this.tabs.length; i++) {
         const tab = this.tabs[i];
         markup += `
        <div class="tab-panel-tab ${tab.className ? tab.className : ""} ${
            this.activeTab == tab.key ? "" : "hide"
         }" data-key="${tab.key}">${tab.content ? tab.content : ""}</div>`;
      }

      markup += `
            </div>
        </div>
      `;

      this.node.innerHTML = markup;
   }

   async openTab({ key }) {
      if (this.activeTab == key) return;

      //Close open tab
      if (this.activeTab) {
         const activeMenuItem = this.getNode(".tab-panel-button.active");
         this.removeClass({ node: activeMenuItem, className: "active" });

         const activeTab = this.getNode(`.tab-panel-tab[data-key='${this.activeTab}']`);
         await this.hide({ node: activeTab, animate: true });
      }

      //Open new tab
      const menuItem = this.getNode(`.tab-panel-button[data-key='${key}']`);
      this.addClass({ node: menuItem, className: "active" });
      const tab = this.getNode(`.tab-panel-tab[data-key='${key}']`);
      this.show({ node: tab, animate: true });

      this.activeTab = key;

      this.fireExternalListenerEvents({ eventTypes: ["change"], data: key });
   }
}
