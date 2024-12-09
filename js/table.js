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

    console.log(typeof data)
    console.log(data)
    console.log(Object.keys(data["Allston"]))
    // headers should be each metro line
    let tableHeaders = ["Neighborhood"].concat(Object.keys(data["Allston"]));

    let tr = table.append('thead').append('tr');
    tr.selectAll('th').data(tableHeaders).enter().append('th').text((d) => d).classed("header", true);

    tr.selectAll('th').each((d, i, elements) => {
      d3.select(elements[i]).classed(elements[i].innerText, true)
    });

    let tbody = table.append('tbody');

    console.log("in table")
    console.log(data)

    for (let neighborhood in data) {
      let row = tbody.append('tr');
      row.append('td').text(neighborhood).classed("Neighborhood", true);
      // change the styling of the neighborhood cell so that it's darker
      // probably make this a custom CSS class so it can have specific actions when selected
      // probably do the same for the column headers
      for (let key in data[neighborhood]) {
        // console.log(data[neighborhood][key])
        row.append('td')
          .text(data[neighborhood][key].join(', '))
          .classed(key, true)
          .classed(neighborhood.split(' ').join('-'), true);
      }
      tbody.append('tr');
    }

    function selectColumn() {
      let thead = d3.select("thead");
      let selected = [];
      // highlight the whole column when hovering over the header
      // then highlight a different color when selecting the header
      // probably don't actually want to drag, just want to let them select the column
      // then send that data to the dispatcher
      // makes it more difficult for the correlation matrix to update if we let it do full brushing

      console.log(thead);
      console.log(thead.selectAll('th'));

      thead.selectAll('th')
        .on('mouseover', (d, i, elements) => {
          console.log(d);
          console.log(i);
          console.log(elements);
          console.log(elements[i]);
          console.log(elements[i].classList[1]);
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
          columnCells.each((d2, j, elements2) => {
            selected.push(d2)
            d3.select(elements2[j]).classed("mouseover", true)
          });

          // send the dispatcher the updated selected points
          // this is going to have to be different so that each CELL gets sent
          // let dispatchString = Object.getOwnPropertyNames(dispatcher._)[0];
          // dispatcher.call(dispatchString, this, selected);


        }) // end of mouseover
        .on('mouseout', (d, i, elements) => {
          d3.select(elements[i]).classed("mouseover", false);
          let tbody = d3.select("tbody");
          let columnCells = tbody.selectAll(`td.${elements[i].classList[1]}`);
          columnCells.each((d2, j, elements2) => {
            // TODO: hopefully this is fine for removing everything from selected
            selected = [];
            d3.select(elements2[j]).classed("mouseover", false);
          })
          console.log(selected);
        })
        .on('mousedown', (d, i, elements) => {
          if (elements[i].classList[1] == "Neighborhood") {
            // because the Neighborhood column is essentially the row header
            return;
          };
          // when mousedown on column header, remove all previously selected columns
          d3.selectAll('td').classed("selected", false);
          d3.selectAll('th').classed("selected", false);
          // then class current column as 'selected', push to selected array, and start dragging
          d3.select(elements[i]).classed("selected", true);
          selected.push(d);

          let tbody = d3.select("tbody");
          let columnCells = tbody.selectAll(`td.${elements[i].classList[1]}`);
          columnCells.each((d2, j, elements2) => {
            selected.push(d2);
            d3.select(elements2[j]).classed("selected", true);
          })

          // send the dispatcher the updated selected points
          // let dispatchString = Object.getOwnPropertyNames(dispatcher._)[0];
          // dispatcher.call(dispatchString, this, selected);
        })
        .on('mouseup', (d, i, elements) => {
          // when mouseup, stop dragging and clear selected array
          selected = [];
        })
    }

    selectColumn();


    return chart;
  }

  return chart;
}

// need to add brushing/linking to table
// consider adding full brushing? Or just add selection?
// I guess if we let it be brushed, we can just add the text of each selected cell to some object
// then send that object to the dispatcher and let the other charts update their selections

// window.table = table;