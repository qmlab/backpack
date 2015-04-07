var Navbar = ReactBootstrap.Navbar
var Nav = ReactBootstrap.Nav
var NavItem = ReactBootstrap.NavItem
var CollapsableNav = ReactBootstrap.CollapsableNav
var Grid = ReactBootstrap.Grid
var Row = ReactBootstrap.Row
var Col = ReactBootstrap.Col
var Panel = ReactBootstrap.Panel
var PanelGroup = ReactBootstrap.PanelGroup
var Label = ReactBootstrap.Label
var Tooltip = ReactBootstrap.Tooltip
var OverlayTrigger = ReactBootstrap.OverlayTrigger

var Table = ReactBootstrap.Table
var thead = ReactBootstrap.thead
var tr = ReactBootstrap.tr
var td = ReactBootstrap.td
var tbody = ReactBootstrap.tbody

var SearchPage = React.createClass({
  search: function(query, options) {
    var url = this.props.url + 'records?1=1'
    if (!!options) {
      options.forEach(function(el, index, arr) {
        url += '&' + el
      })
    }
    $.ajax({
      url: url,
      type: 'POST',
      data: query,
      dataType: 'json',
      success: function(data) {
        this.setState({data: data})
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString())
      }.bind(this)
    })
  },
  getInitialState: function() {
    return {data: []}
  },
  componentDidMount: function() {
    this.search({})
  },
  render: function() {
    return (
      <div className='Page'>
        <NoBetNavbar />
        <SearchBox onSubmit={this.search}/>
        <RecordList data={this.state.data} />
      </div>
    )
  }
})

var SearchBox = React.createClass({
  onFutureCheckedChange: function() {
    var isChecked = !this.state.isFutureChecked
    this.setState({ isFutureChecked: isChecked })
  },
  onClickSortByDate: function(e) {
    this.setState({
      isSortedByDate: e.target.value,
      isSortedByROI: !e.target.value
    })
  },
  onClickSortByROI: function(e) {
    this.setState({
      isSortedByDate: !e.target.value,
      isSortedByROI: e.target.value
    })
  },
  handleSubmit: function(e) {
    if (!!e) {
      e.preventDefault()
    }
    var text = this.refs.searchText.getDOMNode().value
    var queries = text.split(/[ \t]+/).map(function(query) {
      return '{"BetItem.Teams.Name":{"$regex": "' + query + '", "$options" : "imsx"}}'
    })
    var combinedQuery = '{"$or": ['
    var count = 0
    queries.forEach(function(query) {
      if (count > 0) {
        combinedQuery += ','
      }
      combinedQuery += query
      count++
    })
    combinedQuery += ']}'
    if (this.state.isFutureChecked) {
      combinedQuery = '{"$and":[' + combinedQuery + ', {"$or":[{"BetItem.Result":{"$exists":false}}, {"BetItem.Result":"Unknown"}]}]}'
    }

    var options = []
    if (this.state.isSortedByDate) {
      options.push('orderby=BetItem.MatchDate')
      options.push('desc=1')
    }
    else if (this.state.isSortedByROI) {
      options.push('orderby=ROI')
      options.push('desc=1')
    }

    this.props.onSubmit(combinedQuery, options)
  },
  getInitialState: function() {
    return {
      isChecked: false,
      isSortedByDate: false,
      isSortedByROI: false
      }
  },
  render: function() {
    return (
      <div className='SearchBox'>
        <form className='SearchBoxForm' onSubmit={this.handleSubmit}>
          <label className='aria-label'>What to search?</label>
          <div className="input-group input-group-lg">
            <input type='text' className='SearchText form-control' placeholder='search all' maxLength='128' ref='searchText' />
            <span className='input-group-btn'>
              <button className='btn btn-default' type='button' onClick={this.handleSubmit}>Search</button>
            </span>
          </div>
          <div className='checkbox'>
            <label>
              <input type='checkbox' ref='showFutureOnly' checked={this.state.isFutureChecked} onChange={this.onFutureCheckedChange}> Future Only</input>
            </label>
          </div>
          <div className='radios'>
            <label>
              <input type='radio' id='sortByDate' ref='sortByDate' checked={this.state.isSortedByDate} onChange={this.onClickSortByDate}> Sort By Date </input>
            </label>
            <label>
              <input type='radio' id='sortByROI' ref='sortByROI' checked={this.state.isSortedByROI} onChange={this.onClickSortByROI}> Sort By Confidence </input>
            </label>
          </div>
        </form>
      </div>
    )
  }
})

var RecordList = React.createClass({
  render: function() {
    var recordNodes = this.props.data.map(function (record) {
      return (
        <Record key={record._id} data={record} />
      )
    })
    return (
      <Table striped condensed responsive className='RecordList'>
        <thead>
          <tr>
            <th>Home Team</th>
            <th>Away Team</th>
            <th>Confidence</th>
            <th>NoBet Choice</th>
            <th>Real Result</th>
            <th>Match Time</th>
            <th>Odds</th>
            <th>Odds Time</th>
            <th>Bookmaker</th>
          </tr>
        </thead>
        <tbody>
          {recordNodes}
        </tbody>
      </Table>
    )
  }
})

var Record = React.createClass({
  render: function() {
    var betItem = this.props.data.BetItem
    var decision = this.props.data.Decision
    var confidence = toPercent(this.props.data.ROI)
    var result = 'Unknown'
    var localMatchTime = new Date(betItem.MatchDate).toLocaleString()
    var localOddsTime = new Date(betItem.OddsDate).toLocaleString()
    if (typeof this.props.data.BetItem.Result != 'undefined') {
      result = this.props.data.BetItem.Result
    }
    var confidenceClass = 'normalLvl'
    if (this.props.data.ROI >= 0.2) {
      confidenceClass = 'excellentLvl'
    }
    else if (this.props.data.ROI >= 0.1) {
      confidenceClass = 'veryGoodLvl'
    }
    else if (this.props.data.ROI >= 0.05) {
      confidenceClass = 'goodLvl'
    }
    else if (this.props.data.ROI >= 0.02) {
      confidenceClass = 'fairLvl'
    }
    else if (this.props.data.ROI < 0) {
      confidenceClass = 'poorLvl'
    }

    return (
      <tr className='Record'>
        <td>{betItem.Teams[0].Name.replace(/_/g, ' ')}</td>
        <td>{betItem.Teams[1].Name.replace(/_/g, ' ')}</td>
        <td className={confidenceClass}><strong>{confidence}</strong></td>
        <td><strong>{decision}</strong></td>
        <td><strong>{result}</strong></td>
        <td>{localMatchTime}</td>
        <td>{betItem.Odds.Win} / {betItem.Odds.Draw} / {betItem.Odds.Lose}</td>
        <td>{localOddsTime}</td>
        <td>{betItem.BookMaker}</td>
      </tr>
    )
  }
})

var NoBetNavbar = React.createClass({
  onClickSearch: function(e) {
    if (!!e) {
      e.preventDefault()
    }
    React.render(
      <SearchPage url='/'/>,
      document.getElementById('pageContainer')
    )
  },
  onClickStatistics: function(e) {
    if (!!e) {
      e.preventDefault()
    }
    React.render(
      <StatisticsPage url='/'/>,
      document.getElementById('pageContainer')
    )
  },
  render: function() {
    return (
      <Navbar brand='NoBet' toggleNavKey={0}>
        <CollapsableNav eventKey={0}> {/* This is the eventKey referenced */}
          <Nav navbar right>
            <NavItem eventKey={1} href='#' onClick={this.onClickSearch}>Search</NavItem>
            <NavItem eventKey={2} href='#' onClick={this.onClickStatistics}>Statistics</NavItem>
          </Nav>
        </CollapsableNav>
      </Navbar>
    )
  }
})

var StatisticsPage = React.createClass({
  render: function() {
    var itemUrl = this.props.url + 'records'
    var countUrl = this.props.url + 'total'
    return (
      <div className='Page'>
        <NoBetNavbar />
        <PanelGroup>
          <Grid>
            <Row>
              <h1 className='pageTitle'><Label>Facts and Returns</Label></h1>
              <br/>
            </Row>
            <Row>
              <CounterBoxSelected option={{}} eventKey='1' pollInterval={600000} url={countUrl}/>
              <CounterBoxSelected option={{roi: 0}} eventKey='2' pollInterval={600000} url={countUrl}/>
              <CounterBoxSelected option={{roi: 5}} eventKey='3' pollInterval={600000} url={countUrl}/>
              <CounterBoxSelected option={{roi: 10}} eventKey='4' pollInterval={600000} url={countUrl}/>
            </Row>
            <Row>
              <CounterBoxSelected option={{days: 30}} eventKey='5' pollInterval={600000} url={countUrl}/>
              <CounterBoxSelected option={{roi: 0, days: 30}} eventKey='6' pollInterval={600000} url={countUrl}/>
              <CounterBoxSelected option={{roi: 5, days: 30}} eventKey='7' pollInterval={600000} url={countUrl}/>
              <CounterBoxSelected option={{roi: 10, days: 30}} eventKey='8' pollInterval={600000} url={countUrl}/>
            </Row>
            <Row>
              <ReturnBox option={{roi: -30, days: 30}} eventKey='9' pollInterval={600000} url={itemUrl}/>
              <ReturnBox option={{roi: 0, days: 30}} eventKey='10' pollInterval={600000} url={itemUrl}/>
              <ReturnBox option={{roi: 5, days: 30}} eventKey='11' pollInterval={600000} url={itemUrl}/>
              <ReturnBox option={{roi: 10, days: 30}} eventKey='12' pollInterval={600000} url={itemUrl}/>
            </Row>
            <Row>
              <CounterBoxSelected option={{days: 60}} eventKey='13' pollInterval={600000} url={countUrl}/>
              <CounterBoxSelected option={{roi: 0, days: 60}} eventKey='14' pollInterval={600000} url={countUrl}/>
              <CounterBoxSelected option={{roi: 5, days: 60}} eventKey='15' pollInterval={600000} url={countUrl}/>
              <CounterBoxSelected option={{roi: 10, days: 60}} eventKey='16' pollInterval={600000} url={countUrl}/>
            </Row>
            <Row>
              <ReturnBox option={{roi: -30, days: 60}} eventKey='17' pollInterval={600000} url={itemUrl}/>
              <ReturnBox option={{roi: 0, days: 60}} eventKey='18' pollInterval={600000} url={itemUrl}/>
              <ReturnBox option={{roi: 5, days: 60}} eventKey='19' pollInterval={600000} url={itemUrl}/>
              <ReturnBox option={{roi: 10, days: 60}} eventKey='20' pollInterval={600000} url={itemUrl}/>
            </Row>
            <Row>
              <CounterBoxSelected option={{days: 365}} eventKey='21' pollInterval={600000} url={countUrl}/>
              <CounterBoxSelected option={{roi: 0, days: 365}} eventKey='22' pollInterval={600000} url={countUrl}/>
              <CounterBoxSelected option={{roi: 5, days: 365}} eventKey='23' pollInterval={600000} url={countUrl}/>
              <CounterBoxSelected option={{roi: 10, days: 365}} eventKey='24' pollInterval={600000} url={countUrl}/>
            </Row>
            <Row>
              <ReturnBox option={{roi: -30, days: 365}} eventKey='25' pollInterval={600000} url={itemUrl}/>
              <ReturnBox option={{roi: 0, days: 365}} eventKey='26' pollInterval={600000} url={itemUrl}/>
              <ReturnBox option={{roi: 5, days: 365}} eventKey='27' pollInterval={600000} url={itemUrl}/>
              <ReturnBox option={{roi: 10, days: 365}} eventKey='28' pollInterval={600000} url={itemUrl}/>
            </Row>
          </Grid>
        </PanelGroup>
      </div>
    )
  }
})

var ContentWithTooltip = React.createClass({
  render: function() {
    var tip = <Tooltip>{this.props.tip}</Tooltip>
    return (
      <OverlayTrigger placement='top' overlay={tip} delayShow={300} delayHide={150}>
        <div>{this.props.content}</div>
      </OverlayTrigger>
    )
  }
})

var ReturnBox = React.createClass({
  loadROIFromServer: function() {
    var url = this.props.url
    var query = {
      '$and': [
        {'BetItem.Result': {'$exists': 'true'}},
        {'BetItem.Result': {'$ne': 'Unknown'}}
      ]
    }
    if (!!this.props.option.roi || this.props.option.roi === 0) {
      query['$and'].push({
        'ROI': {'$gte': this.props.option.roi / 100}
      })
    }
    if (!!this.props.option.days || this.props.option.days === 0) {
      var afterDate = daysAgo(this.props.option.days)
      query['$and'].push({'BetItem.MatchDate': {'$gte': afterDate}})
    }

    $.ajax({
      url: url,
      type: 'POST',
      data: JSON.stringify(query),
      dataType: 'json',
      success: function(stakes) {
        var actualReturn = 0
        stakes.forEach(function(stake, i, arr) {
          if (stake.Decision == stake.BetItem.Result) {
            if (stake.BetItem.Result == 'Win') {
              actualReturn += stake.BetItem.Odds.Win
            }
            if (stake.BetItem.Result == 'Draw') {
              actualReturn += stake.BetItem.Odds.Draw
            }
            if (stake.BetItem.Result == 'Lose') {
              actualReturn += stake.BetItem.Odds.Lose
            }
          }
        })
        if (stakes.length > 0) {
          actualReturn = Math.round((actualReturn / stakes.length - 1) * 10000) / 100
        }
        this.setState({
          ROI: actualReturn,
          lastUpdateAt: new Date()
          })
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString())
      }.bind(this)
    })
  },
  getInitialState: function() {
    return {
      ROI: 0,
      lastUpdateAt: new Date()
    }
  },
  componentDidMount: function() {
    this.loadROIFromServer();
    setInterval(this.loadROIFromServer, this.props.pollInterval);
  },
  render: function() {
    var header = this.props.option.roi >= 0 ? 'Return | ' + this.props.option.roi * 5 + '%' : 'Return | All bets'
    if (!!this.props.option.days || this.props.option.days === 0) {
      header += ' | ' + this.props.option.days + ' days'
    }
    else {
      header += ' | Overall'
    }
    var roi = this.state.ROI + '%'
    var confidenceContent = <h4>{roi}</h4>
    if (this.state.ROI < 0) {
      return (
        <Col xs={6} md={3}>
          <Panel header={header} eventKey={this.props.eventKey} bsStyle='danger'>
            <ContentWithTooltip tip={'Updated at: ' + this.state.lastUpdateAt.toLocaleTimeString()} content={confidenceContent} />
          </Panel>
        </Col>
      )
    }
    else if (this.state.ROI < 5) {
      return (
        <Col xs={6} md={3}>
          <Panel header={header} eventKey={this.props.eventKey} bsStyle='warning'>
            <ContentWithTooltip tip={'Updated at: ' + this.state.lastUpdateAt.toLocaleTimeString()} content={confidenceContent} />
          </Panel>
        </Col>
      )
    }
    else {
      return (
        <Col xs={6} md={3}>
          <Panel header={header} eventKey={this.props.eventKey} bsStyle='success'>
            <ContentWithTooltip tip={'Updated at: ' + this.state.lastUpdateAt.toLocaleTimeString()} content={confidenceContent} />
          </Panel>
        </Col>
      )
    }
  }
})

var CounterBoxMixin = {
  loadTotalFromServer: function(url, query) {
    $.ajax({
      url: url,
      type: 'POST',
      data: JSON.stringify(query),
      dataType: 'json',
      success: function(count) {
        if (!!count.value || count.value === 0) {
          this.setState({
            counter: count.value,
            lastUpdateAt: new Date()
            })
        }
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(url, status, err.toString())
      }.bind(this)
    })
  },
  getInitialState: function() {
    return {
      counter: 0,
      lastUpdateAt: new Date()
    }
  },
  componentDidMount: function() {
    this.loadTotalFromServer(this.props.url, this.state.query);
    setInterval(function() { this.loadTotalFromServer(this.props.url, this.state.query) }.bind(this), this.props.pollInterval);
  },
  generateComponent: function(header, eventKey) {
    var counterContent = <h4>{this.state.counter}</h4>
    return (
      <Col xs={6} md={3}>
        <Panel header={header} eventKey={eventKey} bsStyle='info'>
          <ContentWithTooltip tip={'Updated at: ' + this.state.lastUpdateAt.toLocaleTimeString()} content={counterContent} />
        </Panel>
      </Col>
    )
  }
}

var CounterBoxSelected = React.createClass({
  mixins: [CounterBoxMixin],
  getInitialState: function() {
    var query = {
      '$and': [
        {'BetItem': {'$exists': 'true'}}
      ]
    }
    var header = 'Matches'
    if (!!this.props.option.roi || this.props.option.roi === 0) {
      query['$and'].push(
        {'ROI': {'$gte': this.props.option.roi / 100}}
      )
      header += ' | ' + this.props.option.roi * 5 +'%'
    }
    if (!!this.props.option.days && this.props.option.days > 0) {
      query['$and'].push(
        {'BetItem.Result': {'$exists': 'true'}},
        {'BetItem.Result': {'$ne': 'Unknown'}},
        {'BetItem.MatchDate': {'$gte': daysAgo(this.props.option.days)}}
      )
      header += ' | ' + this.props.option.days + ' days'
    }
    return {
      query: query,
      header: header
    }
  },
  render: function() {
    return (
      this.generateComponent(this.state.header, this.props.eventKey)
    )
  }
})

React.render(
  <StatisticsPage url='/'/>,
  document.getElementById('pageContainer')
)
