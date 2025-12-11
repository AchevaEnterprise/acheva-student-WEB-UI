export interface IMenu {
  label: string;
  description?: string;
  active_icon: string;
  inactive_icon: string;
  route: string;
  isActive: boolean;
}
