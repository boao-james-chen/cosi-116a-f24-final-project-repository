// Immediately Invoked Function Expression to limit access to our 
// variables and prevent 
((() => {

  console.log("Hello, world!");
  d3.json("data/neighborhood_stations.json", (data) => {
    
    const dispatchString = "selectionUpdated";

    let selectionTable = table()
      // .selectionDispatcher(d3.dispatch(dispatchString))
      ("#table", data);

    //  map visualization
    // adapted from bluebikes example
    let svg = d3.select("#spatial")
      .append("svg")
      .attr("width", 825) 
      .attr("height", 951);

    svg.append("image")
      .attr("xlink:href", "js/boston_map.png") 
      .attr("width", 825) 
      .attr("height", 951) 
      .on("error", () => {
        console.error("image loading failed ");
      });
  


  });

})());