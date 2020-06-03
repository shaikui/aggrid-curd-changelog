/**
 * Created By Shaik
 *   
 * AgGridChangeLogger is a class which helps to Identify the changes of data in ag grid
 *
 */


export class AgGridChangeLogger {

    private gridApi;
    private updateRowData;


    constructor(grid) {
        this.gridApi = grid;
        this.updateRowData = this.gridApi.updateRowData.bind(this.gridApi);
        this.gridApi.updateRowData = this.changeLogTracker.bind(this); // method overriding default updateRowData of ag grid
        this.gridApi.getChangeLog = this.getChangeLog.bind(this)// attach getChangeLoger for gridApi
        this.gridApi.udpateRowValueChange = this.onRowValueChanged.bind(this)// arrach row update for to tracks udpate
        return this.gridApi; //default return of constructor 
    }

    private changeLog = {
        insert: new Map(),
        remove: new Map(),
        update: new Map()
    }

    private changeLogTracker(obj):void {
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
    /**
     * getChangeLog 
     * 
     * return an objet with changes set 
     */
    public getChangeLog(): Object {
        let obj = {
            insert: [...this.changeLog.insert.values()],
            update: [...this.changeLog.update.values()],
            remove: [...this.changeLog.remove.values()]
        }
        return obj;
    }

    private insertHandler(data):void {
        let addArr = data.add;
        addArr.forEach((row) => { this.changeLog.insert.set(row.uuid, row); });
    }

    private removeHandler(data):void {
        let removeArr = data.remove;
        removeArr.forEach((row) => {
            if (this.changeLog.insert.get(row.uuid)) {
                this.changeLog.insert.delete(row.uuid);
            } else {
                if (this.changeLog.update.get(row.uuid))
                    this.changeLog.update.delete(row.uuid);

                this.changeLog.remove.set(row.uuid, row);
            }
        })
    }

    private updateHandler(data) : void {
        let updateArr = data.update;
        let _update = [];
        updateArr.forEach((row) => {
            if (this.changeLog.insert.get(row)) {
                this.changeLog.insert.set(row, row);
            } else {
                this.changeLog.update.set(row.uuid, row);
            }
        })
    }

    private onRowValueChanged(d): void {
        if (!this.changeLog.insert.get(d.data.uuid)) {
            this.changeLog.update.set(d.data.uuid, d.data)
        }
    }
}
