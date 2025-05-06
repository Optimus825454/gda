const mockResponse = jest.fn();

const supabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    mockResponse: function ( data ) {
        mockResponse.mockReturnValueOnce( { data, error: null } );
        return this;
    },
    data: mockResponse
};

module.exports = { supabase };