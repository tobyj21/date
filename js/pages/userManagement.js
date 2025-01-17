"use strict";

class encrypt extends uiComponent {
   constructor({ node, insert, insertClass, parent }) {
      super({ node, insert, insertClass, parent });

      this.render({});

      // Register listeners
      this.registerListeners({
         className: "listener-class-action",
         listeners: [{ function: this.submit, events: ["childEvent"] }],
      });
   }

   render({}) {
      let markup = ``;

      this.node.innerHTML = markup;

      this.input = new textInputComponent({
         node: this.node,
         inlineSubmit: true,
         parent: this,
         externalListeners: [
            {
               type: "submit",
               action: "submit",
            },
         ],
      });
   }

   async submit({}) {
      let input = this.input.getValue();

      const response = await stepCore.server.send({
         sendData: {
            value: input,
         },
         url: "users/encrypt",
      });

      alert(response.value);
   }
}

new encrypt({
   node: document.querySelector(".encrypt-container"),
});
