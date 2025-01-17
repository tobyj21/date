function openModal(target) {
   $("html").addClass("modal-is-locked");
   $("#" + target).addClass("open");

   if (typeof modalOpenAction == "function") {
      modalOpenAction();
   }

   //If tour in process, fire event
   if (typeof Shepherd == "object" && Shepherd.activeTour) {
      if (typeof tourModalOpenEvent == "function") {
         tourModalOpenEvent(target);
      }
   }
}

function closeModal(target) {
   if (!target) {
      const activeModal = $(".modal.open");
      $("html").removeClass("modal-is-locked");
      $(".modal").removeClass("open");
   }

   if (target) {
      $("#" + target).removeClass("open");
      if ($(".modal.open").length == 0) {
         $("html").removeClass("modal-is-locked");
      }
   }
}

$(function () {
   //Move all modals to end of body (nesting in relative elements can otherwise throw errors)
   $(".modal").appendTo("body");

   //Open modal buttons

   $("body").on("click", ".modal-toggle", function (e) {
      e.preventDefault();
      const target = $(this).data("target");
      openModal(target);
   });

   //Close button
   $(".modal .close").click(function (e) {
      const modalId = $(this).closest(".modal").attr("id");
      closeModal(modalId);
   });

   //Overlay click closes modal
   $(".modal").mousedown(function (e) {
      if (e.target != this) return;

      const activeModals = $(".modal.open").length;
      const exitWarnings = $(".modal.open.exit-warning").length;
      if (activeModals > 1 && exitWarnings) {
         if (!confirm("Confirm close all modals")) return;
      }
      closeModal();
   });

   //Pageload with hash anchor
   const link = window.location.hash;
   if (link) {
      openModal(link.substring(1));
   }
});
