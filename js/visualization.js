// visualization.js
(() => {
  console.log("Hello, world!");
  
  d3.json("data/neighborhood_stations.json")
      .then(data => {
          console.log("Data loaded:", data);
          
          const dispatchString = "selectionUpdated";
          
          // Create table visualization
          console.log("Creating table...");
          if (typeof table === 'undefined') {
              console.error("table function is not defined!");
              return;
          }
          
          let selectionTable = table();
          selectionTable("#table", data);
          
          // Create map visualization
          let svg = d3.select("#spatial")
              .append("svg")
              .attr("width", 825)
              .attr("height", 951);
          
          svg.append("image")
              .attr("href", "js/boston_map.png")
              .attr("width", 825)
              .attr("height", 951)
              .on("error", () => {
                  console.error("Image loading failed");
              });

          // Create heatmap
          console.log("Creating heatmap...");
          if (typeof createHeatmap === 'undefined') {
              console.error("createHeatmap function is not defined!");
              return;
          }
          createHeatmap('correlation-matrix');
      })
      .catch(error => {
          console.error("Error loading the data:", error);
      });
})();
