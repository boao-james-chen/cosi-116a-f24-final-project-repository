// table.js
function table() {
  const dispatchString = "selectionUpdated";

  let ourBrush = null,
    selectableElements = d3.select(null),
    dispatcher;

  // Create the chart by adding an svg to the div with the id 
  // specified by the selector using the given data
  function chart(selector, data) {
    let table = d3.select(selector)
      .append("table")
      .classed("my-table", true)
      .classed("text-unselectable", true);
    
    // build table headers and class accordingly
    let tableHeaders = ["Neighborhood"].concat(Object.keys(data["Allston"]));
    let tr = table.append('thead').append('tr');
    tr.selectAll('th').data(tableHeaders).enter().append('th').text((d) => d).classed("header", true);
    tr.selectAll('th').each((d, i, elements) => {
      d3.select(elements[i]).classed(elements[i].innerText, true)
    });

    let tbody = table.append('tbody');

    // create and append to tbody a row for each neighborhood 
    for (let neighborhood in data) {
      let row = tbody.append('tr');
      row.append('td')
        .text(neighborhood)
        .classed("Neighborhood", true)
        .classed(neighborhood.split(' ').join('-'), true);
      for (let key in data[neighborhood]) {
        row.append('td')
          .text(data[neighborhood][key].join(', '))
          .classed(key, true)
          .classed(neighborhood.split(' ').join('-'), true);
      }
    }

    // add highlighting and interactivity for linking to other views
    function selectCells() {
      let tbody = d3.select("tbody");
      let thead = d3.select("thead");
      let selected = [];

      // helper function to update selection styles for sets (rows, columns) of cells
      function updateSelection(cells, className, value, addToSelected = true) {
        cells.each((d, i, elements) => {
          if (addToSelected) {
            selected.push(d);
          }
          d3.select(elements[i]).classed(className, value);
        });
      }

      tbody.selectAll('td')
        .on('mouseover', (d, i, elements) => {
          let rowCells = tbody.selectAll(`td.${elements[i].classList[1]}`);
          updateSelection(rowCells, "mouseover", true);

          if (elements[i].classList[0] === "Neighborhood") {
            // because the Neighborhood column is essentially the row header, only highlight its row
            return;
          };

          // highlight column too
          let columnCells = tbody.selectAll(`td.${elements[i].classList[0]}`);
          updateSelection(columnCells, "mouseover", true);
          let columnHeader = thead.selectAll(`th.${elements[i].classList[0]}`);
          updateSelection(columnHeader, "mouseover", true);
        })
        .on('mouseout', (d, i, elements) => {
          // when mouseout, remove highlighting from previous selection (row/column)
          selected = [];
          d3.select(elements[i]).classed("mouseover", false);
          let rowCells = tbody.selectAll(`td.${elements[i].classList[1]}`);
          updateSelection(rowCells, "mouseover", false, false);

          // update column mouseover style
          let columnCells = tbody.selectAll(`td.${elements[i].classList[0]}`);
          updateSelection(columnCells, "mouseover", false, false);
          let columnHeader = thead.selectAll(`th.${elements[i].classList[0]}`);
          updateSelection(columnHeader, "mouseover", false, false);
        })
        .on('mousedown', (d, i, elements) => {
          // when mousedown anywhere, remove all previously selected cells
          d3.selectAll('td, th').classed("selected", false);
          d3.selectAll('td, th').classed("clicked", false);

          // highlight clicked cell darker than rest of row/column, but matching the headers
          // makes it stand out as the nexus of row/column
          d3.select(elements[i]).classed("clicked", true);

          // highlight selected row, lighter than the selected cell
          let rowCells = tbody.selectAll(`td.${elements[i].classList[1]}`);
          updateSelection(rowCells, "selected", true);

          if (elements[i].classList[0] === "Neighborhood") {
            // because the Neighborhood column is essentially the row header, only highlight its row
            dispatcher.call(dispatchString, this, "neighborhood," + elements[i].textContent);
            return;
          };

          // highlight column of the selected cell
          let columnCells = tbody.selectAll(`td.${elements[i].classList[0]}`);
          updateSelection(columnCells, "selected", true);
          let columnHeader = thead.selectAll(`th.${elements[i].classList[0]}`);
          updateSelection(columnHeader, "selected", true);

          // send the dispatcher the updated selected points
          dispatcher.call(dispatchString, this, "table/station," + elements[i].parentElement.querySelector("td").textContent + "," + elements[i].textContent);
        })
        .on('mouseup', (d, i, elements) => {
          // when mouseup, stop dragging and clear selected array
          selected = [];
        })

      // need to do the same for the column headers
      thead.selectAll('th')
        .on('mouseover', (d, i, elements) => {
          if (elements[i].classList[1] === "Neighborhood") {
            // because the Neighborhood column is essentially the row header
            return;
          };

          // on mouseover, highlight column header, and add to selected array
          d3.select(elements[i]).classed("mouseover", true);
          selected.push(d);

          // then find each cell in the column and highlight accordingly
          let tbody = d3.select("tbody");
          let columnCells = tbody.selectAll(`td.${elements[i].classList[1]}`);
          updateSelection(columnCells, "mouseover", true);

          // send the dispatcher the updated selected points
          let dispatchString = Object.getOwnPropertyNames(dispatcher._)[0];
          dispatcher.call(dispatchString, this, selected);
        })
        .on('mouseout', (d, i, elements) => {
          // when mouseout of header, remove highlighting
          selected = [];
          d3.select(elements[i]).classed("mouseover", false);
          let columnCells = tbody.selectAll(`td.${elements[i].classList[1]}`);
          updateSelection(columnCells, "mouseover", false, false);
        })
        .on('mousedown', (d, i, elements) => {
          if (elements[i].classList[1] == "Neighborhood") {
            // because the Neighborhood column is essentially the row header
            return;
          };
          // when mousedown on column header, remove all previously selected columns
          d3.selectAll('td').classed("selected", false);
          d3.selectAll('th').classed("selected", false);
          d3.selectAll('th').classed("clicked", false);
          d3.selectAll('td').classed("clicked", false);

          // then class current column as 'selected', push to selected array, and start dragging
          d3.select(elements[i]).classed("selected", true);
          selected.push(d);

          let columnCells = tbody.selectAll(`td.${elements[i].classList[1]}`);
          updateSelection(columnCells, "selected", true);

          // send the dispatcher the updated selected points
          let dispatchString = Object.getOwnPropertyNames(dispatcher._)[0];
          dispatcher.call(dispatchString, this, "line," + selected[0]);
        })
        .on('mouseup', (d, i, elements) => {
          // when mouseup, stop dragging and clear selected array
          selected = [];
        })
    }

    selectCells();

    return chart;
  }

  // Gets or sets the dispatcher we use for selection events
  chart.selectionDispatcher = function (_) {
    if (!arguments.length) return dispatcher;
    dispatcher = _;
    return chart;
  };


  // Update the selection in the table
  // ended up not being used because table had less interactivity than originally planned
  chart.updateSelection = function (selectedData, updateType) {
    // console.log("Table selection updated:", selectedData);
    // if (!arguments.length) return;

    // if (updateType === "line") {
    //   d3.selectAll('th').classed("selected", true);
    // } 
    // else if (updateType === "neighborhood") {
    //   d3.selectAll('td').classed("selected", true);
    // }

  };

  return chart;
}