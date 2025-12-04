import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UtilityService {
  loadingGlobal = signal<boolean>(false);

  showLoader() {
    this.loadingGlobal.set(true);
  }

  hideLoader() {
    this.loadingGlobal.set(false);
  }

  formatCount(count: number) {
    return count > 10 ? '10+' : count.toString();
  }

  generateSchoolSessions() {
    const currentYear = new Date().getFullYear();
    const startYear = 2000;
    const sessions = [];

    for (let year = startYear; year <= currentYear; year++) {
      const session = `${year}/${year + 1}`;
      sessions.push(session);
    }

    return sessions.reverse();
  }

  generateAdmissionYear() {
    const currentYear = new Date().getFullYear();
    const startYear = 2000;
    const admissionYear = [];

    for (let year = startYear; year <= currentYear; year++) {
      const session = `${year}`;
      admissionYear.push(session);
    }

    return admissionYear.reverse();
  }
}
