document.body.addEventListener("click", function (event) {
   var target = event.target;
   if (target.classList.contains("has-dropdown") || target.classList.contains("dropdown-toggle")) {
      var node = menuComponent.getNode({ element: target });
      var isOpen = node.classList.contains("dropdown-open");
      if (!isOpen) {
         menuComponent.openNode({ node: node });
      } else {
         menuComponent.closeNode({ node: node });
      }
   }
});

document.body.addEventListener("keyup", function (event) {
   if (event.key === "Enter") {
      var currentElement = document.activeElement;
      if (currentElement.classList.contains("has-dropdown") || currentElement.classList.contains("dropdown-toggle")) {
         var node = menuComponent.getNode({ element: currentElement });
         var isOpen = node.classList.contains("dropdown-open");
         if (!isOpen) {
            menuComponent.openNode({ node: node });
         } else {
            menuComponent.closeNode({ node: node });
         }
      }
   }
});

var menuComponent = {
   openNode: function ({ node }) {
      var menu = node.closest(".nav-menu");
      var dropdownOpenNodes = menu.querySelectorAll(".dropdown-open");
      dropdownOpenNodes.forEach(function (dropdownNode) {
         menuComponent.closeNode({ node: dropdownNode });
      });
      node.classList.add("dropdown-open");
      node.querySelector(".dropdown-toggle").setAttribute("aria-expanded", true);
   },
   closeNode: function ({ node }) {
      node.classList.remove("dropdown-open");
      node.querySelector(".dropdown-toggle").setAttribute("aria-expanded", false);
   },
   getNode: function ({ element }) {
      //Using this instead of .closest() as it seems to be buggy
      element = element;

      // Move up through the ancestors of the current link until we hit 'dropdown' class.
      while (!element.classList.contains("dropdown")) {
         element = element.parentElement;
      }

      return element;
   },
};

(function () {
   var body = document.body;
   var burgerMenu = document.getElementsByClassName("menu-toggle")[0];
   if (!burgerMenu) return;
   var burgerContain = document.getElementsByClassName("full-page-menu")[0];
   var burgerNav = document.getElementsByClassName("expanded-menu")[0];

   burgerMenu.addEventListener(
      "click",
      function toggleClasses() {
         [body, burgerContain, burgerNav].forEach(function (el) {
            try {
               el.classList.toggle("main-nav-open");
            } catch (error) {}
         });
      },
      false
   );

   //If resizing window back to full page size, remove nav open class
   window.addEventListener("resize", function (event) {
      var newWidth = window.innerWidth;
      if (newWidth > 1050) {
         body.classList.remove("main-nav-open");
      }
   });
})();
