import { Component } from '@angular/core';
import { AgGridChangeLogger } from './ag-grid-changeLogger/ag-grid-changeLogger';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'app';
  gridApi;
  rowS = 'multiple';
  editType = "fullRow"
  constructor() {
  }
  columnDefs = [
    { headerName: 'Make', field: 'make', sortable: true, editable: true },
    { headerName: 'Model', field: 'model', sortable: true, editable: true },
    { headerName: 'Price', field: 'price', sortable: true, editable: true }
  ];

  rowData = [
    { make: 'Toyota', model: 'Celica', price: 35000, uuid: Math.random().toString(36).substring(2, 15) },
    { make: 'Ford', model: 'Mondeo', price: 32000, uuid: Math.random().toString(36).substring(2, 15) },
    { make: 'Porsche', model: 'Boxter', price: 72000, uuid: Math.random().toString(36).substring(2, 15) }
  ];

  // XMLHttpRequest in promise format
  makeRequest(method, url, success, error) {
    var httpRequest = new XMLHttpRequest();
    httpRequest.open("GET", url, true);
    httpRequest.responseType = "arraybuffer";

    httpRequest.open(method, url);
    httpRequest.onload = function () {
      success(httpRequest.response);
    };
    httpRequest.onerror = function () {
      error(httpRequest.response);
    };
    httpRequest.send();
  }

  // read the raw data and convert it to a XLSX workbook
  convertDataToWorkbook(data) {
    /* convert data to binary string */
    data = new Uint8Array(data);
    var arr = new Array();

    for (var i = 0; i !== data.length; ++i) {
      arr[i] = String.fromCharCode(data[i]);
    }

    var bstr = arr.join("");

    return XLSX.read(bstr, { type: "binary" });
  }

  // pull out the values we're after, converting it into an array of rowData

  populateGrid(workbook) {
    // our data is in the first sheet
    var firstSheetName = workbook.SheetNames[0];
    var worksheet = workbook.Sheets[firstSheetName];

    // we expect the following columns to be present
    var columns = {
      'A': 'make',
      'B': 'model',
      'C': 'price'
    };

    var data = [];

    // start at the 2nd row - the first row are the headers
    var rowIndex = 2;

    // iterate over the worksheet pulling out the columns we're expecting
    while (worksheet['A' + rowIndex]) {
      var obj = new function test() { };
      //var objData = {};
      Object.keys(columns).forEach(function (column) {
        obj[columns[column]] = worksheet[column + rowIndex].w;
      });
      let uuid = Math.random().toString(36).substring(2, 15);
      obj.constructor.prototype.uuid = uuid;
      data.push(obj);
      rowIndex++;
    }
    this.gridApi.updateRowData({ add:  data});
  }

  importExcel() {
    this.makeRequest('GET',
      'https://www.ag-grid.com/example-excel-import/OlymicData.xlsx',
      // success
      (data) => {
        var workbook = this.convertDataToWorkbook(data);

        this.populateGrid(workbook);
      },
      // error
      function (error) {
        throw error;
      }
    );
  }

  onGridReady(params) {
    this.gridApi = new AgGridChangeLogger(params.api); // if needed multiple instance create like this or just extend 
    this.gridApi.setSuppressClipboardPaste(true);
  }

  remove() {
    var selectedData = this.gridApi.getSelectedRows();
    this.gridApi.updateRowData({ remove: selectedData });
  }

  getChangeLog(){
   console.log(this.gridApi.getChangeLog());
  }

  onRowValueChanged(d) {
    this.gridApi.udpateRowValueChange(d);
  }    

}
