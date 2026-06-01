export interface QuickBook {
  id: string;
  title: string;
  taskCount: number;
}

export const quickBooks: QuickBook[] = [
  { id: '1', title: 'Foundation', taskCount: 4 },
  { id: '2', title: 'Framing', taskCount: 6 },
  { id: '3', title: 'MEP Rough', taskCount: 8 },
  { id: '4', title: 'Drywall', taskCount: 5 },
  { id: '5', title: 'Finishes', taskCount: 7 },
];
