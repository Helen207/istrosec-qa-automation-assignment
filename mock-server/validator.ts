import { z } from 'zod';
import { isIP } from 'node:net';

const uuidRegex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const timestampRegex =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?Z$/;

const ipAddress = z.string().refine((value) => {
    if (isIP(value) !== 0) {
        return true;
    }

    const parts = value.split('%');

    return (
        parts.length === 2 &&
        isIP(parts[0]) === 6 &&
        /^[a-zA-Z0-9_.~-]+$/.test(parts[1])
    );
}, 'Invalid IPv4 or IPv6 address');

const uuid = z.string().regex(uuidRegex, 'Invalid UUID format');

const nonEmptyString = z.string().trim().min(1);

const nonNegativeInteger = z.number().int().min(0);

const timestamp = z.string().refine((value) => {
    const match = timestampRegex.exec(value);

    if (!match) {
        return false;
    }

    const [, year, month, day, hour, minute, second] = match;

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return false;
    }

    return (
        parsed.getUTCFullYear() === Number(year) &&
        parsed.getUTCMonth() + 1 === Number(month) &&
        parsed.getUTCDate() === Number(day) &&
        parsed.getUTCHours() === Number(hour) &&
        parsed.getUTCMinutes() === Number(minute) &&
        parsed.getUTCSeconds() === Number(second)
    );
}, 'Invalid UTC ISO 8601 timestamp');

export const healthcheckSchema = z.strictObject({
    agent_id: uuid,
    base_board_sn: z.string(),
    computer_name: nonEmptyString,
    system_product_uuid: uuid,

    os_name: nonEmptyString,
    os_major: nonNegativeInteger,
    os_minor: nonNegativeInteger,
    os_build: nonNegativeInteger,

    last_boot_time: timestamp,
    last_update_time: timestamp,

    adapter_info: z.array(z.strictObject({
        name: nonEmptyString,
        addresses: z.array(ipAddress),
    })).min(1),

    session_info: z.array(z.strictObject({
        account_name: z.string(),
        account_sid: z.string(),
        host_name: z.string(),
        session_id: nonNegativeInteger,
        session_name: nonEmptyString,
        state: z.enum(['Active', 'Disconnected']),
    })),

    roles: z.array(
        z.enum(['workstation', 'server', 'domain_controller'])
    ).min(1),
});