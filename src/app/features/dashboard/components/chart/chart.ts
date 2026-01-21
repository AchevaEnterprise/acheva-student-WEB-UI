import { Component, computed, input } from '@angular/core';
import Highcharts from 'highcharts';
import { HighchartsChartComponent } from 'highcharts-angular';

@Component({
  selector: 'app-chart',
  imports: [HighchartsChartComponent],
  templateUrl: './chart.html',
  styleUrl: './chart.scss',
})
export class Chart {
  Highcharts: typeof Highcharts = Highcharts;

  chart = input<{ courseCode: string; total: number }[]>([]);

  updateFlag = false;

  chartOptions = computed<Highcharts.Options>(() => {
    const data = this.chart() ?? [];
    this.updateFlag = true;

    return {
      chart: {
        type: 'column',
        backgroundColor: 'transparent',
      },

      title: { text: undefined },

      xAxis: {
        type: 'category',
        categories: data.map((d) => d.courseCode),
        crosshair: true,
      },

      yAxis: {
        min: 0,
        max: 100,
        title: {
          text: 'Total',
        },
        labels: {
          format: '{value}',
        },
      },

      tooltip: {
        pointFormat: '<b>{point.y}</b>',
      },

      plotOptions: {
        column: {
          pointPadding: 0.2,
          borderWidth: 0,
        },
      },

      credits: {
        enabled: false,
      },

      accessibility: {
        enabled: false,
      },

      series: [
        {
          name: 'Total',
          type: 'column',
          data: data.map((d) => Number(d.total) || 0),
        },
      ],
    };
  });
}
