/**
 * Created by PSkip on 4/9/14.
 */
var margin = {top: 20, right: 20, bottom: 30, left: 30},
    width = 960,
    height = 500;

var svg = d3.select(".wpd3-8-0").append("svg")
    .attr("width", width)
    .attr("height", height);

var padding = 30;

var labels = {
    two_pct: "2-Pt Field Goal Percentage",
    three_pct: "3-Pt Field Goal Percentage",
    efg_pct: "Effective Field Goal Percentage",
    orb: "Offensive Rebounds",
    drb: "Defensive Rebounds",
    ast: "Assists",
    stl: "Steals",
    blk: "Blocks",
    tov: "Turnovers",
    pf: "Personal Fouls"
};

d3.csv("http://theunchartedblog.net/wp-content/uploads/2014/04/nba2.csv", function(d) {
        return {
            team: d.team,
            wins: +d.wins,
            two_pct: +d["two_pct"],
            three_pct: +d["three_pct"],
            efg_pct: +( (+d.fg + 0.5*d.three) / +d.fg_a),
            ft_pct: +d.ft_pct,
            orb: +d.orb,
            drb: +d.drb,
            ast: +d.ast,
            stl: +d.stl,
            blk: +d.blk,
            tov: +d.tov,
            pf: +d.pf
        };
    }, function(rows) { /*Callback when csv loaded, rows is an array of objects */
    function makePoints(indepVar /*string*/) {
        return rows.map(function(obj){return [obj.team,obj[indepVar],obj.wins]});
    }
    function addSpace(dataset /*array of arrays*/) {
        var xSpace = (d3.max(dataset, function (d){return d[1]}) - d3.min(dataset, function(d) {return d[1]})) / 20; //Divide by 20 to get approximate 5% of space
        var ySpace = (d3.max(dataset, function (d){return d[2]}) - d3.min(dataset, function(d) {return d[2]})) / 20; //Divide by 20 to get approximate 5% of space
        return [xSpace, ySpace];
    }
    function update(indepVar /*string*/) {
        //Update data
        dataset = makePoints(indepVar);
        //Recompute regression
        reg = linearRegression(dataset.map(function(val) {return val[2]}),dataset.map(function(val) {return val[1]}));
        x_min = d3.min(dataset, function(d) { return d[1]});
        x_max = d3.max(dataset, function(d) { return d[1]});
        //Find new space
        space = addSpace(dataset);
        //Update scale (x only, y doesn't change)
        xScale.domain([d3.min(dataset, function(d) {return d[1]-space[0]; }), d3.max(dataset, function(d) { return d[1]+space[0]; })]);
        //Update points
        svg.selectAll("circle")
            .data(dataset)
            .transition()
            .duration(750)
            .each("start", function() {
                d3.select(this)
                    .attr("fill", "#CD853F")
                    .attr("r", 5)
            })
            .attr("cx", function(d) {return (xScale(d[1]))})
            .transition()
            .duration(750)
            .attr("fill", "#1E90FF")
            .attr("r", 10);
        svg.select("#x-axis")
            .transition()
            .duration(750)
            .call(xAxis);
        svg.select(".regline")
            .transition()
            .duration(750)
            .each("start", function() {
                d3.select(this)
                    .style("stroke", "#CD853F")
                    .style("stroke-width", 5)
            })
            .attr("x1", xScale(x_min))
            .attr("y1", yScale(x_min*reg.slope + reg.intercept))
            .attr("x2", xScale(x_max))
            .attr("y2", yScale(x_max*reg.slope + reg.intercept))
            .transition()
            .duration(750)
            .style("stroke", "#FF2400")
            .style("stroke-width", 10);
        svg.select(".x.label")
            .text(labels[indepVar]);
        svg.select(".rsquared")
            .text("R-Squared: " + Math.round(100*reg.r2)/100)
    }
    function linearRegression(y,x){

        var lr = {};
        var n = y.length;
        var sum_x = 0;
        var sum_y = 0;
        var sum_xy = 0;
        var sum_xx = 0;
        var sum_yy = 0;

        for (var i = 0; i < y.length; i++) {

            sum_x += x[i];
            sum_y += y[i];
            sum_xy += (x[i]*y[i]);
            sum_xx += (x[i]*x[i]);
            sum_yy += (y[i]*y[i]);
        }

        lr['slope'] = (n * sum_xy - sum_x * sum_y) / (n*sum_xx - sum_x * sum_x);
        lr['intercept'] = (sum_y - lr.slope * sum_x)/n;
        lr['r2'] = Math.pow((n*sum_xy - sum_x*sum_y)/Math.sqrt((n*sum_xx-sum_x*sum_x)*(n*sum_yy-sum_y*sum_y)),2);

        return lr;

    }
    var dataset = makePoints("orb");
    var reg = linearRegression(dataset.map(function(val) {return val[2]}),dataset.map(function(val) {return val[1]}));
    var x_min = d3.min(dataset, function(d) { return d[1]});
    var x_max = d3.max(dataset, function(d) { return d[1]});
    var space = addSpace(dataset);
    var xScale = d3.scale.linear()
        .domain([d3.min(dataset, function(d) {return d[1] - space[0]; }), d3.max(dataset, function(d) { return d[1] + space[0]; })])
        .range([padding+margin.left, width-padding]);
    var yScale = d3.scale.linear()
        .domain([0, d3.max(dataset, function(d) { return d[2] + space[1]; })])
        .range([height-padding-margin.bottom, padding]);
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom");
    svg.append("g")
        .attr("class", "axis")
        .attr("id", "x-axis")
        .attr("transform", "translate(0," + (height-padding-margin.bottom) + ")")
        .call(xAxis);
    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left");
    svg.append("g")
        .attr("class", "axis")
        .attr("id", "y-axis")
        .attr("transform", "translate(" + (padding + margin.left) + ",0)")
        .call(yAxis);
    //X-Axis Label
    svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "middle")
        .attr("x", width/2)
        .attr("y", height-10)
        .text("Offensive Rebounds");
    //Y-Axis Label
    svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "middle")
        .attr("x", -height/2)
        .attr("y", 30)
        .attr("transform", "rotate(-90)")
        .text("Wins");
    //Initial Data Join
    svg.selectAll("bball-reg")
        .data(dataset)
        .enter()
        .append("svg:circle")
        .attr("cx", function(d) {
            return xScale(d[1]);
        })
        .attr("cy", function(d) {
            return yScale(d[2]);
        })
        .attr("fill", "#1E90FF")
        .attr("r", 10)
        .attr("class","bball-reg");
    //Initial Reg Line
    svg.append("svg:line")
        .attr("class", "regline")
        .attr("x1", xScale(x_min))
        .attr("y1", yScale(x_min*reg.slope + reg.intercept))
        .attr("x2", xScale(x_max))
        .attr("y2", yScale(x_max*reg.slope + reg.intercept));
    //Initial R^2 Text
    svg.append("text")
        .attr("class", "rsquared")
        .attr("x", width - padding - margin.right)
        .attr("y", height - 70)
        .attr("text-anchor", "end")
        .text("R-Squared: " + Math.round(100*reg.r2)/100);
    //tooltip code
    $('.bball-reg').tipsy({
        gravity: 'w',
        fade: true,
        offset: 15,
        title: function() {
            var d = this.__data__, team = d[0];
            return team;
        }
    });

    //Add Event Listeners
    $("#orb").click(function(event) {
        event.preventDefault();
        update("orb");
    });
    $("#two_pct").click(function(event) {
        event.preventDefault();
        update("two_pct");
    });
    $("#three_pct").click(function(event) {
        event.preventDefault();
        update("three_pct");
    });
    $("#efg_pct").click(function(event) {
        event.preventDefault();
        update("efg_pct");
    });
    $("#ft_pct").click(function(event) {
        event.preventDefault();
        update("ft_pct");
    });
    $("#drb").click(function(event) {
        event.preventDefault();
        update("drb");
    });
    $("#ast").click(function(event) {
        event.preventDefault();
        update("ast");
    });
    $("#stl").click(function(event) {
        event.preventDefault();
        update("stl");
    });
    $("#blk").click(function(event) {
        event.preventDefault();
        update("blk");
    });
    $("#tov").click(function(event) {
        event.preventDefault();
        update("tov");
    });
    $("#pf").click(function(event) {
        event.preventDefault();
        update("pf");
    });
});