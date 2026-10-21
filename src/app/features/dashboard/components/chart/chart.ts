import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import Highcharts from 'highcharts';
import { HighchartsChartComponent } from 'highcharts-angular';

@Component({
  selector: 'app-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HighchartsChartComponent],
  templateUrl: './chart.html',
  styleUrl: './chart.scss',
})
export class Chart {
  Highcharts: typeof Highcharts = Highcharts;

  chart = input<{ courseCode: string; total: number }[]>([]);

  /**
   * PURE. It used to set `this.updateFlag = true` on every evaluation, while
   * the template two-way bound that same field — so Angular read `false`,
   * rendering flipped it to `true`, and the verification pass threw
   * `NG0100: ExpressionChangedAfterItHasBeenChecked` twice on every load of
   * the dashboard.
   *
   * A `computed` is read during rendering and may run any number of times;
   * anything it writes to is a value nobody controls. The flag was not
   * needed either: `highcharts-angular` re-renders whenever `options`
   * changes identity, and this returns a new object whenever the data does.
   */
  chartOptions = computed<Highcharts.Options>(() => {
    const data = this.chart() ?? [];

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
