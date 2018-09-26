/* global Module */
Module.register("MMM-AlphaStock", {
	// Load required additional scripts
	defaults: {
		title: "Stock price",
		symbol: "MFST",
		apiKey: "demo",
		type: "TIME_SERIES_DAILY_ADJUSTED",
		showLastPointLabel: true,
		width: 200,
		height: 100,
		numberOfDatapoints: 50,
		chartLineColor: "rgb(65, 149, 165)",
		chartAreaColor: "rgba(65, 149, 165, 0.2)",
		updateInterval: 1000 * 60 * 60 * 6, // Alphavantage stancard frequency limit is 5 request per minute
	},

	getScripts: function() {
		return [
			"https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.7.2/Chart.min.js",
			this.file("scripts/chartjs-plugin-datalabels.js"),
		];
	},

	start: function() {
		var self = this;
		self.updateDom();
		setInterval(function() {
			self.updateDom();
		}, self.config.updateInterval);
	},

	fetchStockPrice: async function() {
		const { symbol, apikey, type, numberOfDatapoints } = this.config;
		const response = await fetch(
			`https://www.alphavantage.co/query?function=${type}&symbol=${symbol}&apikey=${apikey}`,
		)
			.then(response => response.json())
			.catch(error => console.log("error", error));

		const serie = response["Time Series (Daily)"];

		const x = [];
		const y = [];

		if (serie) {
			Object.entries(serie).forEach(([key, value]) => {
				x.unshift(value["4. close"]);
				y.unshift(key);
			});

			const slicedX = x.slice(numberOfDatapoints);
			const slicedY = y.slice(numberOfDatapoints);

			return { x: slicedX, y: slicedY };
		}
	},

	generateChart: function(canvas, chartData) {
		if (chartData) {
			const chart = new Chart(canvas, {
				type: "line",
				data: {
					labels: chartData.y,
					datasets: [
						{
							label: this.config.symbol,
							fill: true,
							data: chartData.x,
							borderColor: this.config.chartLineColor,
							backgroundColor: this.config.chartAreaColor,
							pointRadius: 0,
						},
					],
				},
				options: {
					responsive: true,
					title: {
						display: true,
						text: this.config.title,
						fontColor: "white",
						fontSize: 16,
					},
					scales: {
						xAxes: [
							{
								display: true,
								ticks: {
									fontSize: 14,
									fontColor: "white",
								},
							},
						],
						yAxes: [
							{
								display: true,
								ticks: {
									fontSize: 20,
									fontColor: "white",
								},
							},
						],
					},
					layout: {
						padding: {
							right: 80,
						},
					},
					legend: {
						labels: {
							// This more specific font property overrides the global property
							fontColor: "white",
							fontSize: 18,
						},
					},
					plugins: {
						datalabels: {
							align: -45,
							backgroundColor: "white",
							borderRadius: 4,
							color: "black",
							display: context =>
								this.config.showLastPointLabel &&
								context.dataIndex === chartData.y.length - 1,
							formatter: value => parseFloat(value).toFixed(2),
							font: {
								weight: "bold",
								size: 25,
							},
						},
					},
				},
			});
		}
	},

	// Override dom generator.
	getDom: async function() {
		const wrapper = document.createElement("canvas");
		wrapper.id = "myChart";
		wrapper.width = this.config.width;
		wrapper.height = this.config.height;

		const ctx = wrapper.getContext("2d");
		const data = await this.fetchStockPrice();
		this.generateChart(ctx, data);

		return wrapper;
	},
});
