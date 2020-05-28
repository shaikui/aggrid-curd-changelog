import { Component } from '@angular/core';
import * as XLSX from 'xlsx';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'app';
  gridApi;
  self = this;
  private updateRowData: any;
  rowS = 'multiple';
  editType = "fullRow";
  changeLog = {
    insert: new Map(),
    remove: new Map(),
    update: new Map()
  }
  constructor() {
    this.self = this;
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
    this.gridApi = params.api;
    this.updateRowData = this.gridApi.updateRowData.bind(this.gridApi);
    this.gridApi.updateRowData = this.changeLogTracker.bind(this); // method overriding default updateRowData of ag grid
  }

  remove() {
    var selectedData = this.gridApi.getSelectedRows();
    this.gridApi.updateRowData({ remove: selectedData });
  }

  changeLogTracker(obj) { 
    for (var key of Object.keys(obj)) {
      switch (key) {
        case 'add':
          this.insertHandler(obj);
          break;
        case 'remove':
          this.removeHandler(obj);
          break;
        case 'update':
          this.updateHandler(obj);
          break;
      }

    }
    this.updateRowData(obj);

  }

  getChangeLog() {
    var obj = {
      insert : [...this.changeLog.insert.values()],
      update : [...this.changeLog.update.values()],
      remove : [...this.changeLog.remove.values()]
    }
    console.log(obj);
  }

  insertHandler(data){
    let addArr = data.add;
    addArr.forEach((row) => { this.changeLog.insert.set(row.uuid,row);});
  }

  removeHandler(data) {
    let removeArr = data.remove;
    removeArr.forEach((row) => {
      if (this.changeLog.insert.get(row.uuid)) {
        this.changeLog.insert.delete(row.uuid);
      } else {
        if(this.changeLog.update.get(row.uuid)) 
            this.changeLog.update.delete(row.uuid);

        this.changeLog.remove.set(row.uuid, row);
      }
    })
  }

  updateHandler(data) {
    let updateArr = data.update;
    let _update = [];
    updateArr.forEach((row) => {
      if (this.changeLog.insert.get(row)) {
        this.changeLog.insert.set(row, row);
      } else {
        this.changeLog.update.set(row.uuid,row);
      }
    })
  }


  processDataFromClipboard(params) {
    console.log(params);
    return params.values
  }

  onRowValueChanged(d) {
    if(!this.changeLog.insert.get(d.data.uuid)){
        this.changeLog.update.set(d.data.uuid,d.data)
    }
  }

}
