"use strict";

class dateComponent extends uiComponent {
   constructor({
      node,
      insert,
      insertClass,
      parent,
      externalListeners,
      label,
      type = "date", //date, dateTime
      date,
      dateStartHour,
      dateStartMin,
      dateEndHour,
      dateEndMin,
      dateMin, // YYYY-MM-DD, now
      dateMax, // YYYY-MM-DD, n days, n months, n years
      hourMin,
      hourMax,
      validation = {},
   }) {
      super({
         node,
         insert,
         insertClass,
         object: {},
         externalListeners,
         parent,
      });
      this.type = type;
      this.date = date;
      this.dateStartHour = dateStartHour;
      this.dateStartMin = dateStartMin;
      this.dateEndHour = dateEndHour;
      this.dateEndMin = dateEndMin;

      this.label = label;
      this.validation = validation;

      if (dateMin === "now") {
         dateMin = this.formatDate({ date: new Date() });
      }

      if (dateMax) {
         let period;
         if (dateMax.match(/days/)) period = "days";
         if (dateMax.match(/months/)) period = "months";
         if (dateMax.match(/years/)) period = "years";

         if (period) {
            let amount = dateMax.match(/\d+/)[0];

            let startDate;
            if (dateMin) startDate = new Date(dateMin);
            if (!dateMin) startDate = new Date();

            dateMax = this.addToDate({ date: startDate, amount, period });
            dateMax = this.formatDate({ date: dateMax });
         }

         if (!period) {
            dateMax = this.formatDate({ date: date });
         }
      }

      this.dateMin = dateMin;
      this.dateMax = dateMax;
      this.hourMin = hourMin;
      this.hourMax = hourMax;

      // Register listeners
      this.registerListeners({
         className: "dates-action",
         listeners: [],
      });

      this.initialize();
   }

   addToDate({ date, amount, period }) {
      const newDate = date;

      switch (period) {
         case "days":
            newDate.setDate(date.getDate() + amount);
            break;
         case "months":
            newDate.setMonth(date.getMonth() + amount);
            break;
         case "years":
            newDate.setFullYear(date.getFullYear() + amount);
            break;
         default:
            // Handle invalid period
            throw new Error("Invalid unit. Supported units are: days, months, years.");
      }

      return newDate;
   }

   formatDate({ date }) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
   }

   initialize() {
      let markup = ``;

      if (this.label) {
         markup += `<label>${this.label}</label>`;
      }

      markup += `
      <div class="date-component-container">      
         <div class="form-element-invalid-message"></div>
         <div class="form-element-input-container">

         <div class="date-component-container-input">
            <input type="date" class="date-input" value="${this.date || ""}" min="${this.dateMin || ""}" max="${
         this.dateMax || ""
      }" />`;

      if (["dateTime", "dateTimeEnd"].includes(this.type)) {
         markup += `Start:  
         <select class="startHour">`;
         for (let i = 7; i < 24; i++) {
            markup += `<option value="${i}" ${i == this.dateStartHour ? "selected" : ""}>${i}</option>`;
         }
         markup += `
         </select>
         <select class="startMinute">
               <option value="0" ${this.dateStartMin == 0 ? `selected` : ``}>00</option>
               <option value="15" ${this.dateStartMin == 15 ? `selected` : ``}>15</option>
               <option value="30" ${this.dateStartMin == 30 ? `selected` : ``}>30</option>
               <option value="45" ${this.dateStartMin == 45 ? `selected` : ``}>45</option>
         </select>   
         `;
      }

      if (this.type == "dateTimeEnd") {
         markup += `End:  
         <select class="endHour">`;
         for (let i = 7; i < 24; i++) {
            markup += `<option value="${i}" ${i == this.dateEndHour ? "selected" : ""}>${i}</option>`;
         }
         markup += `
         </select>
         <select class="endMinute">
               <option value="0" ${this.dateEndMin == 0 ? `selected` : ``}>00</option>
               <option value="15" ${this.dateEndMin == 15 ? `selected` : ``}>15</option>
               <option value="30" ${this.dateEndMin == 30 ? `selected` : ``}>30</option>
               <option value="45" ${this.dateEndMin == 45 ? `selected` : ``}>45</option>
         </select>   
         `;
      }

      markup += `
            </div>
         </div>
      </div> `;

      this.node.innerHTML = markup;
   }

   getValue() {
      const date = this.node.querySelector(`.date-input`).value;
      if (this.type == "date") return date;

      let startHour = null;
      let startMin = null;
      let endHour = null;
      let endMin = null;

      if (this.type == "dateTime" || this.type == "dateTimeEnd") {
         startHour = parseInt(this.node.querySelector(`.startHour`).value);
         startMin = parseInt(this.node.querySelector(`.startMinute`).value);
      }

      if (this.type == "dateTime") {
         return this.createISODateTime({ dateString: date, hour: startHour, minute: startMin });
      }

      if (this.type == "dateTimeEnd") {
         endHour = parseInt(this.node.querySelector(`.endHour`).value);
         endMin = parseInt(this.node.querySelector(`.endMinute`).value);

         let duration = this.getDuration({ startHour, startMin, endHour, endMin });

         return {
            date,
            startHour,
            startMin,
            endHour,
            endMin,
            startDateTime: this.createISODateTime({ dateString: date, hour: startHour, minute: startMin }),
            duration,
         };
      }
   }

   createISODateTime({ dateString, hour, minute }) {
      if (!dateString) return null;

      const isoDateTime = new Date(
         `${dateString}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`
      );
      return isoDateTime.toISOString();
   }

   getDuration({ startHour, startMin, endHour, endMin }) {
      const startDate = new Date(2000, 0, 1, startHour, startMin); // Year and month set to arbitrary values
      const endDate = new Date(2000, 0, 1, endHour, endMin); // Year and month set to arbitrary values

      const diffInMilliseconds = endDate - startDate;
      const diffInMinutes = diffInMilliseconds / (1000 * 60);

      return diffInMinutes;
   }

   validate({ updateUI, scrollTo }) {
      const value = this.getValue();

      if (this.validation.required && (!value || !value.date)) {
         let message = "Required";
         if (updateUI) this.showInvalid({ message, scrollTo });
         return { valid: false, message };
      }

      if (this.type == "dateTimeEnd" && value.date) {
         //Check if end date is after start date
         const afterStart =
            value.endHour > value.startHour || (value.endHour == value.startHour && value.endMin > value.startMin);

         if (!afterStart) {
            let message = "End time must be after start time";
            if (updateUI) this.showInvalid({ message, scrollTo });

            return {
               valid: false,
               message,
            };
         }
      }

      return { valid: true };
   }

   showInvalid({ message, scrollTo }) {
      this.node.classList.add("invalid");
      this.invalid = true;
      this.node.querySelector(".form-element-invalid-message").innerHTML = message;
   }

   clearInvalid({}) {
      this.node.classList.remove("invalid");
      this.invalid = false;
   }
}
