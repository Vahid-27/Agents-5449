import { Hono } from 'hono';
import { cors } from "hono/cors"
import { blogAgentRoutes } from './routes/blog-agent';
import { sessionRoutes } from './routes/sessions';

const app = new Hono()
  .basePath('api');

app.use(cors({
  origin: "*"
}))

app.get('/ping', (c) => c.json({ message: `Pong! ${Date.now()}` }));
app.route('/blog', blogAgentRoutes);
app.route('/sessions', sessionRoutes);

export default app;
