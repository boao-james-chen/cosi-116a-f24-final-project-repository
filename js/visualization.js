// Immediately Invoked Function Expression to limit access to our 
// variables and prevent 
((() => {

  console.log("Hello, world!");
  d3.json("data/Boston_neighborhood_populations_cleaned.csv", (data) => {
    
    const dispatchString = "selectionUpdated";

    let selectionTable = table()
      // .selectionDispatcher(d3.dispatch(dispatchString))
      ("#table", data);


  });

})());