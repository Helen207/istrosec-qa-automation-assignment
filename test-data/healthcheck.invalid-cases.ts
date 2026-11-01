import { validHealthcheckPayload } from './healthcheck.payload';

type HealthcheckPayload = typeof validHealthcheckPayload;

type InvalidCase = {
    name: string;
    modify: (payload: HealthcheckPayload) => void;
    expectedField: string;
    expectedMessage?: string;
};

export const invalidCases: InvalidCase[] = [
    {
        name: 'missing agent_id',
        modify: (payload) => {
            delete (payload as Partial<HealthcheckPayload>).agent_id;
        },
        expectedField: 'agent_id',
    },
    {
        name: 'unknown root field',
        modify: (payload) => {
            Object.assign(payload, {
                unexpected_field: 'weird field value',
            });
        },
        expectedField: 'root',
        expectedMessage: 'unexpected_field',
    },
    {
        name: 'invalid UUID format',
        modify: (payload) => {
            payload.agent_id = 'invalid_uuid';
        },
        expectedField: 'agent_id',
    },
    {
        name: 'negative os_build',
        modify: (payload) => {
            payload.os_build = -1;
        },
        expectedField: 'os_build',
    },
    {
        name: 'invalid IPv4 address',
        modify: (payload) => {
            payload.adapter_info[0].addresses[0] = '999.999.999.999';
        },
        expectedField: 'adapter_info.0.addresses.0',
    },
    {
        name: 'decimal os_build',
        modify: (payload) => {
            payload.os_build = 1.5;
        },
        expectedField: 'os_build',
    },
    {
        name: 'string os_build',
        modify: (payload) => {
            Object.assign(payload, { os_build: '22000' });
        },
        expectedField: 'os_build',
    },
    {
        name: 'timestamp with timezone offset',
        modify: (payload) => {
            payload.last_boot_time = '2022-07-16T20:53:27+00:00';
        },
        expectedField: 'last_boot_time',
    },
    {
        name: 'timestamp without timezone',
        modify: (payload) => {
            payload.last_boot_time = '2022-07-16T20:53:27';
        },
        expectedField: 'last_boot_time',
    },
    {
        name: 'non-existing calendar date',
        modify: (payload) => {
            payload.last_boot_time = '2022-02-30T20:53:27Z';
        },
        expectedField: 'last_boot_time',
    },
    {
        name: 'invalid IPv6 address',
        modify: (payload) => {
            payload.adapter_info[0].addresses[0] = 'gggg::1234';
        },
        expectedField: 'adapter_info.0.addresses.0',
    },
    {
        name: 'empty IPv6 zone index',
        modify: (payload) => {
            payload.adapter_info[0].addresses[0] = 'fe80::1%';
        },
        expectedField: 'adapter_info.0.addresses.0',
    },
    {
        name: 'empty adapter_info',
        modify: (payload) => {
            payload.adapter_info = [];
        },
        expectedField: 'adapter_info',
    },
    {
        name: 'empty roles',
        modify: (payload) => {
            payload.roles = [];
        },
        expectedField: 'roles',
    },
    {
        name: 'unsupported role',
        modify: (payload) => {
            payload.roles = ['admin'];
        },
        expectedField: 'roles.0',
    },
    {
        name: 'Unknown session info state',
        modify: (payload) => {
            payload.session_info[0].state = 'Unknown';
        },
        expectedField: 'session_info.0.state',
    },
    {
        name: 'missing adapter name',
        modify: (payload) => {
            delete (payload.adapter_info[0] as Partial<
                typeof payload.adapter_info[number]
            >).name;
        },
        expectedField: 'adapter_info.0.name',
    },
    {
        name: 'unknown adapter field',
        modify: (payload) => {
            Object.assign(payload.adapter_info[0], {
                unexpected_field: 'value',
            });
        },
        expectedField: 'adapter_info.0',
        expectedMessage: 'unexpected_field',
    },
];