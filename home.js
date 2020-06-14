
class CommonColumnChart {

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
        .domain([0, d3.max(this.passed_data, x => x.VER + 18000)]);

    chart.append('g')
      .attr('class', 'axisLeft')
      .call(d3.axisLeft(yScale));

    /* Make scale Bottom */
    const xScale =
      d3.scaleBand()
        .range([0, this.width])
        .domain(this.passed_data.map(x => x.HOR))
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
    const width_for_line = this.width;

    barGroups
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (g) => xScale(g.HOR))
      .attr('y', (g) => yScale(g.VER))
      .attr('height', (g) => this.height - yScale(g.VER))
      .attr('width', xScale.bandwidth())
      .on('mouseenter', function (actual, i) {
        d3.selectAll(`${unique_id} .value`)
          .attr('opacity', 0)

        d3.select(this)
          .transition()
          .duration(300)
          .attr('opacity', 0.6)
          .attr('x', (a) => xScale(a.HOR) - 5)
          .attr('width', xScale.bandwidth() + 10)

        const y = yScale(actual.VER)

        const line = chart.append('line')
          .attr('id', 'limit')
          .attr('x1', 0)
          .attr('y1', y)
          .attr('x2', width_for_line)
          .attr('y2', y)

        barGroups.append('text')
          .attr('class', 'divergence')
          .attr('x', (a) => xScale(a.HOR) + xScale.bandwidth() / 2)
          .attr('y', (a) => yScale(a.VER) - 10)
          .attr('fill', 'white')
          .attr('text-anchor', 'middle')
          .text((a, idx) => {
            const divergence = (a.VER - actual.VER).toFixed(0)

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
          .attr('x', (a) => xScale(a.HOR))
          .attr('width', xScale.bandwidth())

        chart.selectAll('#limit').remove()
        chart.selectAll('.divergence').remove()
      })

    barGroups
      .append('text')
      .attr('class', 'value')
      .attr('x', (a) => xScale(a.HOR) + xScale.bandwidth() / 2)
      .attr('y', (a) => yScale(a.VER) - 10)
      .attr('text-anchor', 'middle')
      .text((a) => `${a.VER}`)

    this.svg.append('g')
      .attr('transform', `translate(${this.width / 2 - 90}, ${20})`)
      .append('text')
      .attr('class', 'title')
      .text('Categories Wise Expenses')

    /* Rotate Text X text*/
    //console.log(xScale.bandwidth())
    d3.selectAll(`${this.container_id} .axisBottom text`)
      .attr('y', (y, index) => {
        if (index % 2 === 0) { // xScale.bandwidth() < this.passed_data[index].TEXT_WIDTH
          return "29"
        } else {
          return "9"
        }
      })

    //.attr('transform', 'rotate(-90)')
    //.attr('dy', "0")
    //.attr('dx', x => -getWidth(x, 10, 'Arial') / 2 - 10)
    d3.selectAll(`${this.container_id} .axisBottom line`)
      .attr('y2', (y, index) => {
        if (index % 2 === 0) { // xScale.bandwidth() < this.passed_data[index].TEXT_WIDTH
          return "29"
        } else {
          return "9"
        }
      }).attr('stroke', '#fff')

  }

}

function prepare_categories_wise_data(data) {
  d3.select('#categories_wise_expense svg').remove()
  let chart = new CommonColumnChart({
    data: data.map(x => { return { 'VER': x.SpentAmount, 'HOR': x.CategoryDesc, 'TEXT_WIDTH': getWidth(x.CategoryDesc, 10, 'Arial') } }),
    margin: { left: 80, top: 60, bottom: 130, right: 40 },
    container: '#categories_wise_expense'
  })

  chart.draw_axes();
}

function getWidth(text, fontSize, fontFace) {
  var canvas = document.createElement('canvas'),
    context = canvas.getContext('2d');
  context.font = fontSize + 'px ' + fontFace;
  return context.measureText(text).width;
}

function load_CategoriesWiseExpenses() {
  fetch('http://192.168.1.24/MoneyFlow/api/Category/GetCategoriesWiseExpenses')
    .then(response => response.json())
    .then(data => {
      create_table_cwed(data);
      prepare_categories_wise_data(data);

      $("#panel-fullscreen").click(function (e) {
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

        prepare_categories_wise_data(data);

      });

    })
}

function create_table_cwed(data) {
  let newTable = new table({
    data: data,
    id: document.querySelector('#expenses_cwed'),
    name: 'expenses_cwed',
    colNames: ['Category Description', 'Budgeted Amount', 'Spent Amount', "Remaining Amount"],
    colModel: [
      { index: 'CategoryDesc', width: 180, align: 'left', sortable: false, show: true },
      { index: 'BudgetedAmount', width: 120, align: 'right', sortable: false, show: true, show_footer_aggregation: true, footer_callback: footer_formatter },
      { index: 'SpentAmount', width: 120, align: 'right', sortable: false, show: true, show_footer_aggregation: true, footer_callback: footer_formatter },
      { index: 'RemainingAmount', width: 120, align: 'right', sortable: false, show: true, show_footer_aggregation: true, footer_callback: footer_formatter },
    ]
  })

  function footer_formatter(td, col_name, data) {

    let mapped_data = data.map((x) => x[col_name])

    const sum = mapped_data.some((x) => isNaN(x)) ? '' : mapped_data.reduce((x, y) => { return x + y }, 0);

    return `&#8377;${sum.toFixed(2)}`;
  }

  newTable.create();
}

function create_table_ces(data) {
  let newTable = new table({
    data: data,
    id: document.querySelector('#categories'),
    name: 'categories',
    colNames: ['Index', 'Category Description', 'Created Date'],
    colModel: [
      { index: 'Index', width: 100, align: 'right', sortable: false, show: true },
      {
        index: 'CategoryDesc', width: 200, align: 'left', sortable: false, show: true,
        edit: true, edit_uri: (row, current_val) => {
          return `http://192.168.1.24/MoneyFlow/api/category/${row['Index']}?text=${current_val}`;
        }
      },
      { index: 'CreatedDate', width: 220, align: 'center', sortable: false, show: true },
    ]
  })

  newTable.create();
}

function load_categories_data() {
  fetch('http://192.168.1.24/MoneyFlow/api/category')
    .then(response => response.json())
    .then(data => {
      //console.log(data)
      create_table_ces(data);

      $("#panel-fullscreen-ces").click(function (e) {
        e.preventDefault();
        var $this = $(this);

        if ($this.children('i').hasClass('glyphicon-resize-full')) {
          $this.children('i').removeClass('glyphicon-resize-full');
          $this.children('i').addClass('glyphicon-resize-small');
          document.querySelector('body').style.overflowY = "hidden"
          $("#categories").removeClass('scroll-y');
        }
        else if ($this.children('i').hasClass('glyphicon-resize-small')) {
          $this.children('i').removeClass('glyphicon-resize-small');
          $this.children('i').addClass('glyphicon-resize-full');
          $("#categories").addClass('scroll-y');
          document.querySelector('body').style.overflowY = "scroll"
        }
        $(this).closest('.panel').toggleClass('panel-fullscreen');
      })

    })
}

function bind_categories_dropdown() {
  var httpRequest = new XMLHttpRequest();
  httpRequest.onreadystatechange = function () {
    if (this.readyState === 4 && this.status === 200) {
      var myObj = JSON.parse(this.responseText);

      var tablesDropBox = document.getElementById("ddlCategory");

      var option = document.createElement('option');
      option.value = '0';
      option.text = 'Select Category';
      option.selected = true;
      tablesDropBox.appendChild(option);

      for (var select = 0; select < myObj.length; select++) {
        var optionInner = document.createElement('option');
        optionInner.value = myObj[select]["Index"];
        optionInner.text = myObj[select]["CategoryDesc"];
        tablesDropBox.appendChild(optionInner);
      }
    }
  }
  httpRequest.open("GET", "http://192.168.1.24/MoneyFlow/api/Category", false);
  httpRequest.send();
}

$(document).ready(function () {
  load_CategoriesWiseExpenses();
  load_categories_data();
  bind_categories_dropdown();

  document.getElementById('txtBudgetedDateMC').value = today();

  document.querySelector('#expenses_submit').addEventListener('click', () => {
    $('#refresh_page_modal').modal('show');
    let options = Array.from(document.getElementById('ddlCategory').options).filter(x => x.selected);
    let categoryId = options[0].value;

    var ba = document.getElementById('txtBudgetedAmount').value;

    var sa = document.getElementById('txtSpentAmount').value;

    var bdt = document.getElementById('txtBudgetedDateMC').value;

    const uri = "http://192.168.1.24/MoneyFlow/api/Budget/" + 0 + "?cid=" + categoryId + "&ba=" + ba + "&sa=" + sa + '&bdt=' + bdt

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
      if (this.readyState === 4 && this.status === 200) {
        console.log(this.responseText);
        setTimeout(() => {
          window.location.href = "http://192.168.1.24/MoneyFlow/Home"
        }, 2000)
      }
    };
    xhttp.open("POST", uri, true);
    xhttp.send();
  })

  document.querySelector('#btnCategories').addEventListener('click', () => {
    var txtCategory = document.getElementById('txtCategory').value;
    $('#refresh_page_modal').modal('show');

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
      if (this.readyState === 4 && this.status === 200) {
        console.log(this.responseText);
        setTimeout(() => {
          window.location.href = "http://192.168.1.24/MoneyFlow/Home"
        }, 2000)
      }
    };
    xhttp.open("POST", "http://192.168.1.24/MoneyFlow/api/Category/" + 0 + "?text=" + txtCategory, false);
    xhttp.send();
  })

  $("#panel-fullscreen-cwd").click(function (e) {
    e.preventDefault();
    var $this = $(this);

    if ($this.children('i').hasClass('glyphicon-resize-full')) {
      $this.children('i').removeClass('glyphicon-resize-full');
      $this.children('i').addClass('glyphicon-resize-small');
      document.querySelector('body').style.overflowY = "hidden"
      $("#expenses_cwed").removeClass('scroll-y');
    }
    else if ($this.children('i').hasClass('glyphicon-resize-small')) {
      $this.children('i').removeClass('glyphicon-resize-small');
      $this.children('i').addClass('glyphicon-resize-full');
      $("#expenses_cwed").addClass('scroll-y');
      document.querySelector('body').style.overflowY = "scroll"
    }
    $(this).closest('.panel').toggleClass('panel-fullscreen');
  })
});

function refresh_page() {

}
