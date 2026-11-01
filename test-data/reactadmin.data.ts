export const reactAdminUser = {
    username: 'demo',
    password: 'demo',
} as const;

export const newCustomer = {
    firstName: 'Ivana',
    lastName: 'Qatester',
    email: 'ivana.qatester@example.com',
    password: 'S3cret-pass',
} as const;

export type Customer = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
};
