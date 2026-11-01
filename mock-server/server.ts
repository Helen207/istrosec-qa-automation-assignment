import express, { Request, Response } from 'express';
import { healthcheckSchema} from "./validator";

const app = express();
const PORT = 3001;

app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({status: 'ready'});
});

app.post('/healthcheck', (req: Request, res: Response) => {
    const result = healthcheckSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            status: 'error',
            errors: result.error.issues.map(issue => ({
                field: issue.path.join('.') || 'root',
                message: issue.message,
            })),
        });
    }

    return res.status(200).json({
        status: 'ok',
    });
});

app.listen(PORT, '127.0.0.1', () => {
    console.log(`Mock server running on http://127.0.0.1:${PORT}`);
})
