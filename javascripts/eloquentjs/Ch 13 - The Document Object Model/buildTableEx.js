/**
 * Created with mcmillenb.
 * User: mcmillenb
 * Date: 2015-04-04
 * Time: 04:38 PM
 */

function buildTable(data) {
    // Takes in elements with all the same properties and 
    // builds a table from it. The header states all the 
    // property names and then a row is created for each
    // element, listing its values for each property
    
    // build the table and first row
    var table = document.createElement("table");
    var row = document.createElement("tr");
    
    // get the properties for the first element
    var props = Object.keys(data[0]); 

    // for each property, add it to the header row
    var header, cell, text;
    for(var i = 0; i < props.length; i++) {
        header = document.createElement("th");
        text = document.createTextNode(props[i]);
        header.appendChild(text);
        row.appendChild(header);
    }
    table.appendChild(row);
    
    // for each element in the data
    for(var i = 0; i < data.length; i++) {
        // create a new row
        row = document.createElement("tr");

        // get the properties for that element
        var vals = Object.keys(data[i]);
    
        // for each property
        for(var j = 0; j < vals.length; j++) {
            // get the value of the property
            var val = props[j];
            
            // create the cell
            cell = document.createElement("td");
            text = document.createTextNode(data[i][val]);
            cell.appendChild(text);
            row.appendChild(cell);
            
            // right-align cells with numbers 
            if(typeof data[i][val] == "number") 
                cell.style.textAlign = "right";
        }
        table.appendChild(row);
    }
    return table;
}

var MOUNTAINS = [{
    name: "Kilimanjaro",
    height: 5895,
    country: "Tanzania"
}, {
    name: "Everest",
    height: 8848,
    country: "Nepal"
}, {
    name: "Mount Fuji",
    height: 3776,
    country: "Japan"
}, {
    name: "Mont Blanc",
    height: 4808,
    country: "Italy/France"
}, {
    name: "Vaalserberg",
    height: 323,
    country: "Netherlands"
}, {
    name: "Denali",
    height: 6168,
    country: "United States"
}, {
    name: "Popocatepetl",
    height: 5465,
    country: "Mexico"
}];

document.body.appendChild(buildTable(MOUNTAINS));