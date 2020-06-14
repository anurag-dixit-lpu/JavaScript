

window.addEventListener('load', (e) => {
  load_entire_data(today(), today())
})

function load_entire_data(sdt, edt) {
  var xHttp = new XMLHttpRequest();
  xHttp.onreadystatechange = function () {
    if (this.readyState === 4 && this.status === 200) {
      const data = JSON.parse(this.responseText);
      create_table(data);
      $("#panel-fullscreen-ees").click(function (e) {
        e.preventDefault();
        var $this = $(this);

        if ($this.children('i').hasClass('glyphicon-resize-full')) {
          $this.children('i').removeClass('glyphicon-resize-full');
          $this.children('i').addClass('glyphicon-resize-small');
          document.querySelector('body').style.overflowY = "hidden"
          $("#expenses").removeClass('scroll-y');
        }
        else if ($this.children('i').hasClass('glyphicon-resize-small')) {
          $this.children('i').removeClass('glyphicon-resize-small');
          $this.children('i').addClass('glyphicon-resize-full');
          $("#expenses").addClass('scroll-y');
          document.querySelector('body').style.overflowY = "scroll"
        }
        $(this).closest('.panel').toggleClass('panel-fullscreen');
      })
      create_graph(data);
      $("#panel-fullscreen_salary_credited").click(function (e) {
        e.preventDefault();
        var $this = $(this);

        if ($this.children('i').hasClass('glyphicon-resize-full')) {
          $this.children('i').removeClass('glyphicon-resize-full');
          $this.children('i').addClass('glyphicon-resize-small');
        }
        else if ($this.children('i').hasClass('glyphicon-resize-small')) {
          $this.children('i').removeClass('glyphicon-resize-small');
          $this.children('i').addClass('glyphicon-resize-full');
        }
        $(this).closest('.panel').toggleClass('panel-fullscreen');

        create_graph(data);

      });
      prepare_categories_data(data);
      $("#panel-fullscreen_rs").click(function (e) {
        e.preventDefault();
        var $this = $(this);

        if ($this.children('i').hasClass('glyphicon-resize-full')) {
          $this.children('i').removeClass('glyphicon-resize-full');
          $this.children('i').addClass('glyphicon-resize-small');
        }
        else if ($this.children('i').hasClass('glyphicon-resize-small')) {
          $this.children('i').removeClass('glyphicon-resize-small');
          $this.children('i').addClass('glyphicon-resize-full');
        }
        $(this).closest('.panel').toggleClass('panel-fullscreen');

        prepare_categories_data(data);

      });
    }
  };
  xHttp.open("GET", 'http://192.168.1.24/MoneyFlow/api/Budget?sdt=' + sdt + '&edt=' + edt + '&ignoreDates=true', false);
  xHttp.send();
}

function create_table(myObj) {
  let newTable = new table({
    data: myObj.filter(x => x.Index === 45),
    id: document.querySelector('#expenses'),
    name: 'expenses',
    colNames: ['&#x25BA;', 'Index', "Budget Index", 'Category Description', 'Amount Credited', 'Spent Amount', "Remaining Amount", "Created Date"],//, 'Budgeted Amount', 'Spent Amount', 'Action'],
    colModel: [
      { // sub grid column start
        index: 'Index',
        align: 'right',
        sortable: false,
        width: 30,
        body_callback: (td, val, row) => {
          td.setAttribute('style', 'text-align:center;color:lightgray;cursor:pointer;width:30pt;');
          return `&#x25BA;`;
        },
        show_sub_grid: true,
        sub_grid_action: (tr, data_row, row_index) => {
          let filter_month = data_row.Month, filter_year = data_row.Year;
          let my_sub_grid = new table({
            data: myObj.filter(x => x.Month === filter_month && x.Year === data_row.Year && x.Index !== 45),
            id: tr.querySelector('div'),
            name: 'sub_expenses' + row_index,
            colNames: ['Index', 'Budget Index', 'Category', 'Budgeted Amount', 'Spent Amount', "Remaining Amount", "Created Date"],
            colModel: [
              { index: 'Index', width: 50, align: 'right', sortable: false, show: false },
              { index: 'BudgetIndex', width: 60, align: 'right', sortable: false, show: false },
              {
                index: 'CategoryDesc', width: 200, align: 'left', sortable: false, type: 'select', selected_index: 'Index',
                edit: true, edit_uri: (row, current_val) => {
                  return `http://192.168.1.24/MoneyFlow/api/Budget/${row['BudgetIndex']}?cid=${current_val}&ba=${row['BudgetedAmount']}&sa=${row['SpentAmount']}&bdt=${row['StringCreateDatetime']}`;
                }, body_callback: (td, val, row) => {
                  let select = td.querySelector('select')

                  return select !== null ? Array.from(select.options).filter(x => x.value == val)[0].text : val;
                }
              },
              {
                index: 'BudgetedAmount', width: 150, align: 'right', type: 'input', dataType: 'string', sortable: false, edit: true,
                body_callback: (td, val, row) => {
                  return `&#8377;${val}`;
                },
                edit_uri: (row, current_val) => {
                  return `http://192.168.1.24/MoneyFlow/api/Budget/${row['BudgetIndex']}?cid=${row['Index']}&ba=${current_val}&sa=${row['SpentAmount']}&bdt=${row['StringCreateDatetime']}`;
                },
                show_footer_aggregation: true, footer_callback: footer_formatter
              },
              {
                index: 'SpentAmount', width: 150, align: 'right', type: 'input', dataType: 'string', sortable: true, edit: true,
                body_callback: (td, val, row) => { return `&#8377;${val}`; },
                edit_uri: (row, current_val) => {
                  return `http://192.168.1.24/MoneyFlow/api/Budget/${row['BudgetIndex']}?cid=${row['Index']}&ba=${row['BudgetedAmount']}&sa=${current_val}&bdt=${row['StringCreateDatetime']}`;
                },
                show_footer_aggregation: true, footer_callback: footer_formatter
              },
              {
                index: 'RemainingAmount', width: 100, align: 'right', type: 'input', dataType: 'string',
                sortable: true,
                body_callback: (td, val, row) => { return `&#8377;${val}`; },
                show_footer_aggregation: true, footer_callback: footer_formatter
              },
              {
                index: 'StringCreateDatetime',
                width: 180, align: 'center', sortable: true,
                body_callback: (td, val, row) => { return `${val}`; },
                edit: true, edit_uri: (row, current_val) => {
                  return `http://192.168.1.24/MoneyFlow/api/Budget/${row['BudgetIndex']}?cid=${row['Index']}&ba=${row['BudgetedAmount']}&sa=${row['SpentAmount']}&bdt=${current_val}`;
                }
              },
            ]
          })

          my_sub_grid.create()
        }
      }, // sub grid column end
      { index: 'Index', width: 70, align: 'right', identity: true, dataType: 'int', sortable: false, show: false },
      { index: 'BudgetIndex', width: 70, align: 'right', identity: true, dataType: 'int', sortable: false, show: false },
      { index: 'CategoryDesc', width: 170, align: 'left', type: 'select', sortable: false, edit: false },
      {
        index: 'BudgetedAmount', width: 150, align: 'right', type: 'input', dataType: 'string', sortable: false, edit: true,
        body_callback: (td, val, row) => { return `&#8377;${val}`; },
        edit_uri: (row, current_val) => {
          return `http://192.168.1.24/MoneyFlow/api/Budget/${row['BudgetIndex']}?cid=${row['Index']}&ba=${current_val}&sa=${row['SpentAmount']}&bdt=${row['StringCreateDatetime']}`;
        },
        footer_callback: footer_formatter,
        show_footer_aggregation: true
      },
      {
        index: 'SpentAmount',
        width: 150, align: 'right', type: 'input',
        dataType: 'string', sortable: true,
        body_callback: (td, val, row) => { return `&#8377;${val}`; },
        edit: true, edit_uri: (row, current_val) => {
          return `http://192.168.1.24/MoneyFlow/api/Budget/${row['BudgetIndex']}?cid=${row['Index']}&ba=${row['BudgetedAmount']}&sa=${current_val}&bdt=${row['StringCreateDatetime']}`;
        },
        footer_callback: footer_formatter,
      },
      {
        index: 'RemainingAmount', width: 100, align: 'right', type: 'input', dataType: 'string',
        sortable: true,
        body_callback: (td, val, row) => { return `&#8377;${val}`; },
        footer_callback: footer_formatter,
      },
      {
        index: 'StringCreateDatetime',
        width: 235, align: 'center', sortable: true,
        body_callback: (td, val, row) => { return `${val}`; },
        edit: true, edit_uri: (row, current_val) => {
          // alert(current_val)
          return `http://192.168.1.24/MoneyFlow/api/Budget/${row['BudgetIndex']}?cid=${row['Index']}&ba=${row['BudgetedAmount']}&sa=${row['SpentAmount']}&bdt=${current_val}`;
        }
      },
    ],
  })

  newTable.create()

  function footer_formatter(td, col_name, data) {

    let mapped_data = data.map((x) => x[col_name])

    const sum = mapped_data.some((x) => isNaN(x)) ? '' : mapped_data.reduce((x, y) => { return x + y }, 0);

    return `&#8377;${sum}`;
  }

}

function today() {
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

function create_graph(data) {
  d3.select('#salary_credited svg').remove()
  let chart = new ColumnChart({
    data: data.filter(x => x.Index === 45),
    margin: { left: 80, top: 40, bottom: 50, right: 40 },
    container: '#salary_credited'
  })

  chart.draw_axes();
}

class ColumnChart {

  constructor(conf) {
    this.container_id = conf.container;
    this.container = document.querySelector(conf.container)
    this.passed_data = conf.data;
    this.margin = conf.margin;
    this.width = this.container.clientWidth - conf.margin.left - conf.margin.right;
    this.height = this.container.clientHeight - conf.margin.top - conf.margin.bottom;;
    this.svg = d3.select(conf.container).append('svg').attr('class', 'svg')
  }

  draw_axes() {

    const chart =
      this.svg.append('g')
        .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)

    /* Make scale Left */
    const yScale =
      d3.scaleLinear()
        .range([this.height, 0])
        .domain([0, d3.max(this.passed_data, x => x.BudgetedAmount + 1800)]);

    chart.append('g')
      .attr('class', 'axisLeft')
      .call(d3.axisLeft(yScale));

    /* Make scale Bottom */
    const xScale =
      d3.scaleBand()
        .range([0, this.width])
        .domain(this.passed_data.map(x => x.StringCreateDate))
        .padding(0.4);

    chart.append('g')
      .attr('class', 'axisBottom')
      .attr('transform', `translate(0, ${this.height})`)
      .call(d3.axisBottom(xScale));

    /* Make lines X - Horizontal */
    const makeXLines =
      () => d3.axisLeft()
        .scale(yScale)

    chart.append('g')
      .attr('class', 'grid')
      .call(makeXLines()
        .tickSize(-this.width, 0, 0)
        .tickFormat('')
      )

    /* Make lines Y -  Vertical*/
    const makeYLines =
      () => d3.axisBottom()
        .scale(xScale)

    chart.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0, ${this.height})`)
      .call(makeYLines().tickSize(-this.height, 0, 0).tickFormat(''))

    const barGroups =
      chart.selectAll()
        .data(this.passed_data)
        .enter()
        .append('g')

    const unique_id = this.container_id;

    barGroups
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (g) => xScale(g.StringCreateDate))
      .attr('y', (g) => yScale(g.BudgetedAmount))
      .attr('height', (g) => this.height - yScale(g.BudgetedAmount))
      .attr('width', xScale.bandwidth())
      .on('mouseenter', function (actual, i) {
        d3.selectAll(`${unique_id} .value`)
          .attr('opacity', 0)

        d3.select(this)
          .transition()
          .duration(300)
          .attr('opacity', 0.6)
          .attr('x', (a) => xScale(a.StringCreateDate) - 5)
          .attr('width', xScale.bandwidth() + 10)

        const y = yScale(actual.BudgetedAmount)

        const line = chart.append('line')
          .attr('id', 'limit')
          .attr('x1', 0)
          .attr('y1', y)
          .attr('x2', 1200)
          .attr('y2', y)

        barGroups.append('text')
          .attr('class', 'divergence')
          .attr('x', (a) => xScale(a.StringCreateDate) + xScale.bandwidth() / 2)
          .attr('y', (a) => yScale(a.BudgetedAmount) - 10)
          .attr('fill', 'white')
          .attr('text-anchor', 'middle')
          .text((a, idx) => {
            const divergence = (a.BudgetedAmount - actual.BudgetedAmount)

            let text = ''
            if (divergence > 0) text += '+'
            text += `${divergence}`

            return idx !== i ? text : '';
          })

      })
      .on('mouseleave', function () {
        d3.selectAll('.value')
          .attr('opacity', 1)

        d3.select(this)
          .transition()
          .duration(300)
          .attr('opacity', 1)
          .attr('x', (a) => xScale(a.StringCreateDate))
          .attr('width', xScale.bandwidth())

        chart.selectAll('#limit').remove()
        chart.selectAll('.divergence').remove()
      })

    barGroups
      .append('text')
      .attr('class', 'value')
      .attr('x', (a) => xScale(a.StringCreateDate) + xScale.bandwidth() / 2)
      .attr('y', (a) => yScale(a.BudgetedAmount) - 10)
      .attr('text-anchor', 'middle')
      .text((a) => `${a.BudgetedAmount}`)

    this.svg.append('g')
      .attr('transform', `translate(${this.width / 2}, ${20})`)
      .append('text')
      .attr('class', 'title')
      .text('Salary Credited')
  }

}

function prepare_categories_data(data) {
  d3.select('#salary_remaining svg').remove();

  let chart = new NegativeValueColumnsChart({
    data: data.filter(x => x.Index === 45),
    margin: { left: 80, top: 60, bottom: 50, right: 40 },
    container: '#salary_remaining'
  })

  chart.draw_axes();
}

class NegativeValueColumnsChart {

  constructor(conf) {
    this.container_id = conf.container;
    this.container = document.querySelector(conf.container);
    this.passed_data = conf.data.map(y => {
      return { 'RemainingAmount': y.RemainingAmount, 'StringCreateDate': this.get_month(y.StringCreateDate) }
    });
    this.margin = conf.margin;
    this.width = this.container.clientWidth - conf.margin.left - conf.margin.right;
    this.height = this.container.clientHeight - conf.margin.top - conf.margin.bottom;;
    this.svg = d3.select(conf.container).append('svg').attr('class', 'svg');
  }

  draw_axes() {

    const chart =
      this.svg.append('g')
        .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)

    /* Make scale Left */
    const yScale =
      d3.scaleLinear()
        .range([this.height, 0])
        .domain([d3.min(this.passed_data, x => x.RemainingAmount) - 5000, d3.max(this.passed_data, x => Math.abs(x.RemainingAmount) + 10900)]);

    // console.log(yScale(0));

    chart.append('g')
      .attr('class', 'axisLeft')
      .call(d3.axisLeft(yScale));

    /* Make scale Bottom */
    const xScale =
      d3.scaleBand()
        .range([0, this.width])
        .domain(this.passed_data.map(x => x.StringCreateDate))
        .padding(0.4);

    chart.append('g')
      .attr('class', 'axisBottom')
      .attr('transform', `translate(0, ${this.height})`)
      .call(d3.axisBottom(xScale)); //tickValues([]) remove both ticks and labels, .tickFormat("") to remove labels

    /* Make scale Top */
    chart.append('g')
      .attr('class', 'axisBottom')
      .attr('transform', `translate(0, ${0})`)
      .call(d3.axisTop(xScale));

    /* Make lines X - Horizontal */
    const makeXLines =
      () => d3.axisLeft()
        .scale(yScale)

    chart.append('g')
      .attr('class', 'grid xGrid')
      .call(makeXLines()
        .tickSize(-this.width, 0, 0)
        .tickFormat('')
      )

    /* Make lines Y -  Vertical*/
    const makeYLines =
      () => d3.axisBottom()
        .scale(xScale)

    chart.append('g')
      .attr('class', 'grid yGrid')
      .attr('transform', `translate(0, ${this.height})`)
      .call(makeYLines().tickSize(-this.height, 0, 0).tickFormat(''))

    const barGroups =
      chart.selectAll()
        .data(this.passed_data)
        .enter()
        .append('g')

    const unique_id = `${this.container_id}`;

    barGroups
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (g) => xScale(g.StringCreateDate))
      .attr('y', (g) => {
        if (g.RemainingAmount > 0) {
          return yScale(g.RemainingAmount);
        } else {

        }
        return yScale(0)
      })
      .attr('height', (g) => {
        if (g.RemainingAmount > 0) {
          return yScale(0) - yScale(g.RemainingAmount)
        } else {
          return yScale(g.RemainingAmount) - yScale(0);
        }
      })
      .attr('width', xScale.bandwidth())
      .attr('fill', (x) => {
        if (x.RemainingAmount > 0) {
          return '#4CAF50'
        } else {
          return '#ff814e'
        }
      })
      .on('mouseenter', function (actual, i) {

        d3.selectAll(`${unique_id} .value`)
          .attr('opacity', 0)

        d3.select(this)
          .transition()
          .duration(300)
          .attr('opacity', 0.6)
          .attr('x', (a) => xScale(a.StringCreateDate) - 5)
          .attr('width', xScale.bandwidth() + 10)

        const y = yScale(actual.RemainingAmount)

        const line = chart.append('line')
          .attr('id', 'limit')
          .attr('x1', 0)
          .attr('y1', y)
          .attr('x2', 1200)
          .attr('y2', y)

        barGroups.append('text')
          .attr('class', 'divergence')
          .attr('x', (a) => xScale(a.StringCreateDate) + xScale.bandwidth() / 2)
          .attr('y', (a) => yScale(a.RemainingAmount) - 10)
          .attr('fill', 'white')
          .attr('text-anchor', 'middle')
          .text((a, idx) => {
            const divergence = (a.RemainingAmount - actual.RemainingAmount)

            let text = ''
            if (divergence > 0) text += '+'
            text += `${divergence}`

            return idx !== i ? text : '';
          })

      })
      .on('mouseleave', function () {
        d3.selectAll('.value')
          .attr('opacity', 1)

        d3.select(this)
          .transition()
          .duration(300)
          .attr('opacity', 1)
          .attr('x', (a) => xScale(a.StringCreateDate))
          .attr('width', xScale.bandwidth())

        chart.selectAll('#limit').remove()
        chart.selectAll('.divergence').remove()
      })

    chart.append('g')
      .attr('transform', `translate(${0}, ${yScale(0)})`)
      .attr('class', 'seperatorLine')
      .append('path')
      .attr('d', `M0,0 L${this.width},0`)


    barGroups
      .append('text')
      .attr('class', 'value')
      .attr('x', (a) => xScale(a.StringCreateDate) + xScale.bandwidth() / 2)
      .attr('y', (a) => {
        if (a.RemainingAmount > 0) {
          return yScale(a.RemainingAmount) - 5;
        } else {
          return yScale(a.RemainingAmount) + 15;
        }

      })
      .attr('text-anchor', 'middle')
      .text((a) => `${a.RemainingAmount}`)

    this.svg.append('g')
      .attr('transform', `translate(${this.width / 2}, ${20})`)
      .append('text')
      .attr('class', 'title')
      .text('Salary Remaining')
  }

  get_month(dt) {
    var date = new Date(dt);
    let mlist = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${mlist[date.getMonth()]} ${date.getFullYear()}`;
  }

}

