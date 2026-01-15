export interface Barber {
    id: string;
    name: string;
    specialty?: string;
    avatar?: string;
    commissionRate?: number;
}

export const BARBERS: Barber[] = [
    {
        id: 'luiz-uuid',
        name: 'Luiz',
        specialty: 'Corte Clássico',
        commissionRate: 0.5
    },
    {
        id: 'william-uuid',
        name: 'William',
        specialty: 'Degradê & Freestyle',
        commissionRate: 0.5
    },
    {
        id: 'antonio-uuid',
        name: 'Antonio',
        specialty: 'Barba Terapia',
        commissionRate: 0.5
    },
    {
        id: 'bruna-uuid',
        name: 'Bruna',
        specialty: 'Colorimetria',
        commissionRate: 0.5
    }
];
