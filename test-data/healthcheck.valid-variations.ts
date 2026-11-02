import { validHealthcheckPayload } from './healthcheck.payload';

type HealthcheckPayload = typeof validHealthcheckPayload;

type ValidVariation = {
    name: string;
    modify: (payload: HealthcheckPayload) => void;
};

export const validVariations: ValidVariation[] = [
    {
        name: 'server role',
        modify: (payload) => {
            payload.roles = ['server'];
        },
    },
    {
        name: 'domain_controller role',
        modify: (payload) => {
            payload.roles = ['domain_controller'];
        },
    },
    {
        name: 'all roles together',
        modify: (payload) => {
            payload.roles = ['workstation', 'server', 'domain_controller'];
        },
    },
    {
        name: 'IPv4-only adapter',
        modify: (payload) => {
            payload.adapter_info = [{ name: 'Ethernet', addresses: ['10.0.0.5'] }];
        },
    },
    {
        name: 'IPv6-only adapter',
        modify: (payload) => {
            payload.adapter_info = [{ name: 'Ethernet', addresses: ['2001:db8::1'] }];
        },
    },
    {
        name: 'empty base_board_sn',
        modify: (payload) => {
            payload.base_board_sn = '';
        },
    },
    {
        name: 'lowercase UUIDs',
        modify: (payload) => {
            payload.agent_id = payload.agent_id.toLowerCase();
            payload.system_product_uuid = payload.system_product_uuid.toLowerCase();
        },
    },
    {
        name: 'zero OS version numbers',
        modify: (payload) => {
            payload.os_major = 0;
            payload.os_minor = 0;
            payload.os_build = 0;
        },
    },
];
