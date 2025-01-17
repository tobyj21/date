"use strict";

class review extends uiComponent {
   constructor({ node, insert, insertClass, parent }) {
      super({ node, insert, insertClass, parent });

      this.render({});

      // Register listeners
      this.registerListeners({
         className: "review-action",
         listeners: [
            { function: this.toggleDay, events: ["click"] },
            { function: this.toggleSession, events: ["click"] },
         ],
      });
   }

   async render({}) {
      this.data = await this.getData({});

      this.data = this.structureData({ data: this.data });

      console.log(this.data);

      let markup = ``;

      for (let d = 0; d < this.data.length; d++) {
         const day = this.data[d];
         markup += this.renderDay({ day, index: d });
      }

      this.node.innerHTML = markup;
   }

   getData({}) {
      return new Promise(async function (resolve, reject) {
         // Get a reference to the Firebase Realtime Database
         var dbRef = firebase.database().ref("dating");

         dbRef.once("value", function (snapshot) {
            // The snapshot contains all the data under "yourTable"
            var data = snapshot.val(); // This returns the entire data at "yourTable"

            console.log(data); // You can inspect the data here, or process it further

            // Example: Iterating over each record and logging it
            resolve(data);
         });
      });
   }

   structureData({ data }) {
      const groupedBySession = {};

      // Step 1: Group by session and sort by timestamp
      Object.keys(data).forEach((timestamp) => {
         const record = data[timestamp];
         const sessionKey = record.session;

         if (!groupedBySession[sessionKey]) {
            groupedBySession[sessionKey] = {
               session: sessionKey,
               timestamp: parseInt(timestamp), // Earliest timestamp (first record)
               records: [],
            };
         }

         // Add the record to the respective session group
         groupedBySession[sessionKey].records.push({
            timestamp: parseInt(timestamp),
            key: record.key,
            option: record.option,
         });

         // Update the earliest timestamp for the session if this timestamp is earlier
         groupedBySession[sessionKey].timestamp = Math.min(groupedBySession[sessionKey].timestamp, parseInt(timestamp));
      });

      // Step 2: Group sessions by date
      const groupedByDate = [];

      Object.keys(groupedBySession).forEach((sessionKey) => {
         const session = groupedBySession[sessionKey];
         const sessionDate = new Date(session.timestamp);
         const formattedDate = `${sessionDate.getDate()}/${sessionDate.getMonth() + 1}/${sessionDate.getFullYear()}`;

         let dateGroup = groupedByDate.find((d) => d.date === formattedDate);
         if (!dateGroup) {
            dateGroup = {
               date: formattedDate,
               sessions: [],
            };
            groupedByDate.push(dateGroup);
         }

         // Add the session to the correct date group
         dateGroup.sessions.push(session);
      });

      // Step 3: Sort sessions by the earliest timestamp (date) and the days by date
      groupedByDate.forEach((dateGroup) => {
         dateGroup.sessions.sort((a, b) => a.timestamp - b.timestamp);
      });

      groupedByDate.sort((a, b) => {
         const dateA = new Date(a.date.split("/").reverse().join("-"));
         const dateB = new Date(b.date.split("/").reverse().join("-"));
         return dateA - dateB;
      });

      return groupedByDate;
   }
   renderDay({ day, index }) {
      let markup = `
      <div class="light-item day-item">
         <div> 
            <div class="review-action toggle" data-action="toggleDay" data-index="${index}">${day.date}: ${day.sessions.length} </div>
            <div class="sessions light-container hide" data-index="${index}">`;

      for (let s = 0; s < day.sessions.length; s++) {
         const session = day.sessions[s];
         markup += this.renderSession({ session, index: s });
      }

      markup += `
            </div>
         </div> 
      </div>
      
      
      `;

      return markup;
   }

   renderSession({ session, index }) {
      //Render timestamp as time of day
      const date = new Date(session.timestamp);
      const time = `${date.getHours()}:${date.getMinutes()}`;
      let markup = `
      <div class="light-item session toggle review-action" data-action="toggleSession" data-id="${index}">
         <div class="icon-clock">${time}</div>
         <div class="light-items">`;

      for (let r = 0; r < session.records.length; r++) {
         const record = session.records[r];
         markup += `
         <div class="session-records hide" data-id="${index}">
            ${record.key}: ${record.option}
            ${record.multi ? `<BR>(${record.multi})` : ""}
            ${record.text ? `<BR>(${record.text})` : ""}
         </div>
         `;
      }

      markup += `
         </div>
      </div>
      `;

      return markup;
   }

   toggleDay({ index }) {
      this.updateVisibility({ selector: `.sessions[data-index="${index}"]`, toggle: true, selectAll: true });
   }

   toggleSession({ id }) {
      this.updateVisibility({ selector: `.session-records[data-id="${id}"]`, toggle: true, selectAll: true });
   }

   async updateVisibility({ visible, toggle, selector, node, animate, selectAll }) {
      if (toggle) {
         if (selector) node = this.getNode(selector);
         visible = node.classList.contains("hide");
      }

      if (visible) await this.show({ selector, node, animate, selectAll });
      if (!visible) await this.hide({ selector, node, animate, selectAll });
   }
}

const firebaseConfig = {
   apiKey: "AIzaSyCwOCizs8yd9rXbsmY_Olk-fDdCx93Y280",
   authDomain: "dating-b927d.firebaseapp.com",
   databaseURL: "https://dating-b927d-default-rtdb.firebaseio.com/",
   projectId: "dating-b927d",
   storageBucket: "dating-b927d.firebasestorage.app",
   messagingSenderId: "1061527675628",
   appId: "1:1061527675628:web:5139cf95fbeea258713bc9",
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

// Initialize Firestore or Realtime Database
const firestore = firebase.firestore(); // For Firestore
const db = firebase.database(); // For Realtime Database

new review({ node: document.querySelector(".date-container") });
