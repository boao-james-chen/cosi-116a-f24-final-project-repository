// table.js
function table() {
  console.log("top of table");
  let ourBrush = null,
      selectableElements = d3.select(null),
      dispatcher;

  // Create the chart by adding an svg to the div with the id 
  // specified by the selector using the given data
  function chart(selector, data) {
      console.log("in chart");
      let table = d3.select(selector)
          .append("table")
          .classed("my-table", true)
          .classed("text-unselectable", true);

      console.log(typeof data);
      console.log(data);
      console.log(Object.keys(data["Allston"]));

      // headers should be each metro line
      let tableHeaders = ["Neighborhood"].concat(Object.keys(data["Allston"]));
      let tr = table.append('thead').append('tr');
      tr.selectAll('th')
          .data(tableHeaders)
          .enter()
          .append('th')
          .text((d) => d);

      let tbody = table.append('tbody');
      console.log("in table");
      console.log(data);

      // Fixed for...in loop syntax
      for (let neighborhood in data) {
          let row = tbody.append('tr');
          row.append('td').text(neighborhood);
          for (let key in data[neighborhood]) {
              console.log(data[neighborhood][key]);
              row.append('td').text(data[neighborhood][key].join(', '));
          }
      }

      return chart;
  }

  return chart;
}

window.table = table;