export const formatDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

export const qualificationOrder = ['Certificate', 'Diploma', 'Bachelor', 'Master'];
