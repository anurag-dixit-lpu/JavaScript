class table {

    constructor(table_configuration) {
        this.t_c = table_configuration;
        this.name = table_configuration.name;
        this.id = table_configuration.id;
        // this.style = table_configuration.style;
        // this.class = table_configuration.class;
        // console.log(table_configuration)
        // this.id.appendChild(this.create_thead())
        this.sort = [{ SORT: table_configuration.sort }]
        this.current_edit = { col_name: '', row_index: -1, prev_val: '', current_val: '', is_save_button_shown: false }
        this.sub_grid_cache = []
    }

    create() {
        this.create_tables()
        this.create_thead()
        this.create_tbody()
        this.create_tfoot()
    }

    create_tables() {
        // thead
        let thead = document.createElement('table')
        thead.id = `thead_${this.name}`
        this.id.appendChild(thead)
        // tbody
        let tbody = document.createElement('table')
        tbody.id = `tbody_${this.name}`
        this.id.appendChild(tbody)
        // tfooter
        let tfooter = document.createElement('table')
        tfooter.id = `tfoot_${this.name}`
        this.id.appendChild(tfooter)
    }

    create_thead() {

        let tableHeader = document.createElement('thead')
        tableHeader.setAttribute('class', 'my_h_table')

        let tbodyElement = document.createElement('tbody')
        let trElement = document.createElement('tr')

        this.t_c.colNames.forEach((item, index) => {

            if (this.t_c.colModel[index].hasOwnProperty('show') && !this.t_c.colModel[index].show) return;

            let thElement = document.createElement('th')

            if (this.has_m('sortable') &&
                this.t_c.colModel[index].sortable) {
                thElement.setAttribute('onclick', `header_sort("${this.t_c.colModel[index].index}")`)
            }

            thElement.innerHTML = this.has_h('header_callback') ?
                this.t_c.header_callback(thElement, item, index) : this.headerCallback(thElement, item, index);

            trElement.appendChild(thElement)
        })

        tbodyElement.appendChild(trElement)
        tableHeader.appendChild(tbodyElement)

        this.get_table('thead').appendChild(tableHeader);

        return tableHeader;
    }

    create_tbody() {

        let tbodyElement = document.createElement('tbody')

        this.t_c.data.forEach((row, row_index) => {

            let trElement = document.createElement('tr')
            trElement.setAttribute('class', 'my_parent_grid_tr')

            this.t_c.colModel.forEach((cell) => {

                if (cell.hasOwnProperty('show') && !cell.show) return;

                let tdElement = document.createElement('td')

                tdElement.setAttribute('align', cell.align)
                tdElement.setAttribute('style', 'width: ' + (parseInt(cell.width)) + 'pt;')
                tdElement.setAttribute('class', 'my_parent_grid_td')

                if (cell.hasOwnProperty('body_callback')) {
                    tdElement.innerHTML = cell.body_callback(tdElement, row[cell.index], row);
                }
                else {
                    tdElement.innerHTML = `${row[cell.index]}`; //&#8377;
                }

                if (cell.hasOwnProperty('show_sub_grid') && cell.show_sub_grid) {
                    tdElement.addEventListener('click', (sub_grid_click_event) => {

                        const row_index_sub = sub_grid_click_event.target.parentElement.rowIndex;
                        let parent_table = this.get_table('tbody');

                        let chached_sub = this.sub_grid_cache.filter(x => x.IDENTITY == row.BudgetIndex)

                        if (chached_sub.length > 0 && chached_sub[0].is_shown) {
                            console.log(chached_sub[0]) // remove after testing
                            chached_sub[0].is_shown = false;
                            parent_table.deleteRow(row_index_sub + 1); // delete row
                            tdElement.innerHTML = '&#x25BA;' // change icon
                        }
                        else {
                            let sub_tr = parent_table.insertRow(row_index_sub + 1)

                            // TR td classes
                            sub_tr.setAttribute('class', 'my_sub_grid_tr')
                            tdElement.setAttribute('class', 'my_sub_grid_td')


                            // Empty TD
                            let empty_sub_td = document.createElement('td')
                            sub_tr.appendChild(empty_sub_td) // TD 2 TR

                            // Main TD
                            let sub_td = document.createElement('td')
                            sub_td.colSpan = this.t_c.colNames.length;
                            sub_td.innerHTML = `<div id="${this.get_table('tbody').id}_${row_index_sub}"></div>`;

                            sub_tr.appendChild(sub_td) // TD 2 TR

                            // change ICON
                            tdElement.innerHTML = '&#x25BC;'
                            // write cache
                            if (chached_sub.length == 0) {
                                this.sub_grid_cache.push({ IDENTITY: row.BudgetIndex, is_shown: true })
                            } else if (!chached_sub[0].is_shown) {
                                chached_sub[0].is_shown = true
                            }

                            // console.log(tdElement)

                            // attach handler
                            if (cell.hasOwnProperty('sub_grid_action')) {
                                // create div
                                console.log('SUB GRID Event')
                                cell.sub_grid_action(sub_tr, row, row_index_sub + 1);
                            }
                        }
                    })
                }

                if (cell.hasOwnProperty('edit') && cell.edit) {
                    if (cell.hasOwnProperty('edit_callback')) {
                        tdElement.addEventListener('click', cell.edit_callback())
                    }
                    else {
                        tdElement.setAttribute('class', 'my_parent_grid_td pointer')
                        // tdElement.setAttribute('style', 'width: ' + (parseInt(cell.width)) + 'pt;border-right:10px solid gray;padding-right:0px;')
                        tdElement.addEventListener('click', (click_event) => {
                            let current_val_col_name = cell.hasOwnProperty('selected_index') ? cell.selected_index : cell.index;
                            if (this.current_edit.row_index < 0) {

                                if (cell.hasOwnProperty('type') && cell.type === 'select') {
                                    // add option list
                                    let option_list = document.createElement('select')
                                    this.bindCategories(option_list, row['Index'])
                                    option_list.setAttribute('style', `width: ${parseInt(cell.width) - (parseInt(cell.width) / 2)}pt;color:black;text-align:right;border-radius:0px;`)
                                    option_list.setAttribute("class", "form-control")

                                    // stop event propogation - bubbling
                                    option_list.addEventListener('click', (child_event) => {
                                        child_event.stopPropagation();
                                    })

                                    // Set changed value
                                    option_list.addEventListener('change', (textbox_blur_event) => {
                                        textbox_blur_event.stopPropagation();
                                        this.current_edit.current_val = textbox_blur_event.target.value
                                    })

                                    tdElement.innerHTML = ''; // Clear inner elements before setting new elements
                                    tdElement.appendChild(option_list) // Add Textbox
                                }
                                else {
                                    // Add textbox
                                    let text = document.createElement('input')
                                    text.setAttribute('style', `width: ${parseInt(cell.width) - (parseInt(cell.width) / 2)}pt;color:black;text-align:right;border-radius:0px;`)
                                    text.setAttribute("class", "form-control")
                                    text.value = row[cell.index];
                                    // stop event propogation - bubbling
                                    text.addEventListener('click', (child_event) => {
                                        child_event.stopPropagation();
                                    })
                                    // Set changed value
                                    text.addEventListener('blur', (textbox_blur_event) => {
                                        textbox_blur_event.stopPropagation();
                                        this.current_edit.current_val = textbox_blur_event.target.value
                                    })
                                    tdElement.innerHTML = ''; // Clear inner elements before setting new elements
                                    tdElement.appendChild(text) // Add Textbox
                                }

                                if (!this.current_edit.is_save_button_shown) {

                                    // Add Save button
                                    let save_button = document.createElement('button')
                                    save_button.setAttribute('class', 'btn btn-success')
                                    save_button.setAttribute('style', 'padding-left:3px;padding-right:3px;border-radius:0px;')
                                    save_button.innerText = 'Save'
                                    save_button.addEventListener('click', (save_event) => {
                                        save_event.stopPropagation();


                                        // const entry_id = row['Index']
                                        // const b_i = row['BudgetIndex']
                                        // const ba = this.current_edit.col_name == 'BudgetedAmount' ? this.current_edit.current_val : row['BudgetedAmount']
                                        // const sa = this.current_edit.col_name == 'SpentAmount' ? this.current_edit.current_val : row['SpentAmount']
                                        let uri = '';
                                        if (cell.hasOwnProperty('edit_uri')) {
                                            uri = cell.edit_uri(row, this.current_edit.current_val)
                                        } else {
                                            throw Error('Edit URI is not specified.')
                                        }

                                        console.log(uri) // To be commented later

                                        var xhttp = new XMLHttpRequest();
                                        xhttp.onreadystatechange = () => {
                                            if (xhttp.readyState == 4 && xhttp.status == 200) {

                                                // tdElement.innerHTML = this.current_edit.current_val;
                                                //
                                                if (cell.hasOwnProperty('body_callback')) {
                                                    tdElement.innerHTML = cell.body_callback(tdElement, this.current_edit.current_val, row);
                                                } else {
                                                    tdElement.innerHTML = `${this.current_edit.current_val}`; //&#8377;
                                                }
                                                //
                                                tdElement.style.display = 'table-cell'

                                                // Remove to cache
                                                this.current_edit.col_name = '';
                                                this.current_edit.row_index = -1;
                                                this.current_edit.prev_val = ''
                                                this.current_edit.current_val = ''
                                                this.current_edit.is_save_button_shown = false;
                                            }
                                        };
                                        xhttp.open("POST", uri, true);
                                        xhttp.send();
                                    })
                                    tdElement.appendChild(save_button) //append to td

                                    // Add Undo Button
                                    let undo_button = document.createElement('button')
                                    undo_button.setAttribute('class', 'btn btn-warning')
                                    undo_button.setAttribute('style', 'padding-left:3px;padding-right:3px;border-radius:0px;')
                                    undo_button.innerText = 'Undo'
                                    undo_button.addEventListener('click', (undo_event) => {
                                        undo_event.stopPropagation();
                                        // tdElement.innerHTML = this.current_edit.prev_val;
                                        //
                                        if (cell.hasOwnProperty('body_callback')) {
                                            tdElement.innerHTML = cell.body_callback(tdElement, this.current_edit.prev_val, row);
                                        } else {
                                            tdElement.innerHTML = `${this.current_edit.prev_val}`; //&#8377;
                                        }
                                        //
                                        tdElement.style.display = 'table-cell'
                                        // Remove to cache
                                        this.current_edit.col_name = '';
                                        this.current_edit.row_index = -1;
                                        this.current_edit.prev_val = ''
                                        this.current_edit.current_val = ''
                                        this.current_edit.is_save_button_shown = false;
                                        // console.log(this.current_edit)
                                    })
                                    tdElement.appendChild(undo_button) //append to td

                                    tdElement.style.display = 'flex'
                                    this.current_edit.is_save_button_shown = true
                                }

                                // set current Edit
                                this.current_edit.col_name = cell.index;
                                this.current_edit.row_index = row_index;
                                this.current_edit.prev_val = row[current_val_col_name]
                                this.current_edit.current_val = row[current_val_col_name]
                            }
                        }, false);

                    }
                }


                trElement.appendChild(tdElement)
            })

            tbodyElement.appendChild(trElement)
        })

        this.get_table('tbody').appendChild(tbodyElement)
    }

    create_tfoot() {
        let tfoot = document.createElement('tfoot')
        tfoot.setAttribute('class', 'my_f_table')

        let trElement = document.createElement('tr')

        this.t_c.colModel.forEach((item, index) => {

            if (item.hasOwnProperty('show') && !item.show) return;

            let tdElement = document.createElement('td')

            tdElement.setAttribute('style', `width:${this.t_c.colModel[index].width}pt;text-align:right;vertical-align:top;font-weight:900;color:#fff;`)

            tdElement.innerHTML = item.hasOwnProperty('footer_callback') ?
                item.footer_callback(tdElement, item.index, this.t_c.data) : this.footerCallback(tdElement, item.index, item);

            trElement.appendChild(tdElement)
        })

        tfoot.appendChild(trElement)

        this.get_table('tfoot').appendChild(tfoot);

        return tfoot;
    }

    footerCallback(th, name, item) {
        th.setAttribute('class', 'my_f_td')

        return item.hasOwnProperty('show_footer_aggregation') && item.show_footer_aggregation ? `${this.sum(name)}` : ''
    }

    sum(col_name) {
        let mapped_data = this.t_c.data.map((x) => x[col_name])

        return mapped_data.some((x) => isNaN(x)) ? '' : mapped_data.reduce((x, y) => { return x + y }, 0);
    }

    headerCallback(td, name, index) {
        td.setAttribute('class', 'my_th')
        td.setAttribute('style', `width:${this.t_c.colModel[index].width}pt;text-align:center;vertical-align:top;`)
        return `${this.create_plus_minues(name, index)}`
    }

    create_plus_minues(name, index) {
        let plus_or_minues = ''

        plus_or_minues =
            `<div 
                style='border-width: 8px; border-style: solid; 
                border-color: #e06c75 transparent transparent transparent; content: " "; 
                width:10px; margin-left:45%'>
            </div>
            <span>${name}</span>`

        if (this.t_c.colModel[index].hasOwnProperty('sortable') && this.t_c.colModel[index].sortable) {
            return plus_or_minues;
        } else {
            return `<span>${name}</span>`;
        }

    }

    has_h(prop) {
        return this.t_c.hasOwnProperty(prop);
    }

    has_m(prop) {
        return this.t_c.colModel.hasOwnProperty(prop);
    }

    get_table(name) {
        return document.querySelector(`#${name}_${this.name}`)
    }

    today() {
        let today = new Date();
        let dd = today.getDate();
        let mm = today.getMonth() + 1;

        let yyyy = today.getFullYear();
        if (dd < 10) {
            dd = '0' + dd;
        }
        if (mm < 10) {
            mm = '0' + mm;
        }
        return today = mm + '/' + dd + '/' + yyyy;
    }

    bindCategories(tablesDropBox, selected_index) {

        var httpRequest = new XMLHttpRequest();
        httpRequest.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                var myObj = JSON.parse(this.responseText);

                var option = document.createElement('option');
                option.value = '0';
                option.text = '--Select Category--';
                option.selected = true;
                tablesDropBox.appendChild(option);

                for (var select = 0; select < myObj.length; select++) {
                    var optionInner = document.createElement('option');
                    optionInner.value = myObj[select]["Index"];
                    optionInner.text = myObj[select]["CategoryDesc"];
                    if (myObj[select]["Index"] == selected_index) {
                        optionInner.selected = true
                    }
                    tablesDropBox.appendChild(optionInner);
                }
                
            }
        }
        httpRequest.open("GET", "http://192.168.1.24/MoneyFlow/api/Category", false);
        httpRequest.send();
    }
}

