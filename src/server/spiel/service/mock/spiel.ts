export const spiel: any = {
    _id: '00000000-0000-0000-0000-000000000001',
    titel: 'Alpha',
    rating: 4,
    art: 'DRUCKAUSGABE',
    verlag: 'IWI_VERLAG',
    preis: 11.1,
    rabatt: 0.011,
    lieferbar: true,
    datum: new Date('2018-02-01T00:00:00.000Z'),
    isbn: '000-0-00000-000-1',
    homepage: 'https://hska.at/',
    schlagwoerter: ['JAVASCRIPT'],
    autoren: [
        {
            nachname: 'Alpha',
            vorname: 'Adriana',
        },
        {
            nachname: 'Alpha',
            vorname: 'Alfred',
        },
    ],
    __v: 0,
    createdAt: 0,
    updatedAt: 0,
};

export const spiele = [
    spiel,
    {
        _id: '00000000-0000-0000-0000-000000000002',
        titel: 'Beta',
        rating: 2,
        art: 'KINDLE',
        verlag: 'HSKA_VERLAG',
        preis: 22.2,
        rabatt: 0.022,
        lieferbar: true,
        datum: new Date('2018-02-02T00:00:00.000Z'),
        isbn: '000-0-00000-000-2',
        homepage: 'https://hska.biz/',
        schlagwoerter: ['TYPESCRIPT'],
        autoren: [
            {
                nachname: 'Beta',
                vorname: 'Brunhilde',
            },
        ],
        __v: 0,
        createdAt: 0,
        updatedAt: 0,
    },
];
