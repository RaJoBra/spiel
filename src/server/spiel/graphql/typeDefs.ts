export const typeDefs = `
    enum Art {
        DRUCKAUSGABE
        KINDLE
    }

    enum Verlag {
        IWI_VERLAG
        HSKA_VERLAG
    }

    type Spiel {
        _id: ID!
        titel: String!
        rating: Int
        art: Art
        verlag: Verlag!
        preis: Float
        rabatt: Float
        lieferbar: Boolean
        datum: String
        isbn: String
        homepage: String
        schlagwoerter: [String]
        version: Int
    }

    type Query {
        spiele(titel: String): [Spiel]
        spiel(id: ID!): Spiel
    }

    type Mutation {
        createSpiel(titel: String!, rating: Int, art: String, verlag: String!
            preis: Float, rabatt: Float, lieferbar: Boolean, datum: String,
            isbn: String, homepage: String, schlagwoerter: [String]): Spiel
        updateSpiel(_id: ID, titel: String!, rating: Int, art: String,
            verlag: String!, preis: Float, rabatt: Float, lieferbar: Boolean,
            datum: String, isbn: String, homepage: String,
            schlagwoerter: [String], version: Int): Boolean
        deleteSpiel(id: ID!): Boolean
    }
`;
