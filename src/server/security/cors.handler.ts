import * as cors from 'cors';

export const corsHandler =
    // CORS = Cross Origin Resource Sharing
    //   http://www.html5rocks.com/en/tutorials/cors
    //   https://www.w3.org/TR/cors
    cors({
        origin: 'https://localhost',
        // nachfolgende Optionen nur fuer OPTIONS:
        methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowedHeaders: [
            'Origin',
            'Content-Type',
            'Accept',
            'Authorization',
            'Access-Control-Allow-Origin',
            'Access-Control-Allow-Methods',
            'Access-Control-Allow-Headers',
            'Allow',
            'Content-Length',
            'Date',
            'Last-Modified',
            'If-Match',
            'If-Not-Match',
            'If-Modified-Since',
        ],
        exposedHeaders: ['Location', 'ETag'],
        maxAge: 86400,
    });
