/**
 * AuditLog.js - Kullanıcı işlem logları veri modeli
 */

const { supabase } = require( '../config/supabase' );

class AuditLog {
    constructor( {
        id,
        userId,
        action,
        entity,
        entityId,
        details,
        ipAddress,
        userAgent,
        createdAt
    } ) {
        this.id = id;
        this.userId = userId;
        this.action = action;
        this.entity = entity;
        this.entityId = entityId;
        this.details = details;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.createdAt = createdAt;
    }

    // Veritabanı kaydından AuditLog nesnesi oluşturur
    static fromDatabase( dbLog ) {
        return new AuditLog( {
            id: dbLog.id,
            userId: dbLog.user_id,
            action: dbLog.action,
            entity: dbLog.entity,
            entityId: dbLog.entity_id,
            details: dbLog.details,
            ipAddress: dbLog.ip_address,
            userAgent: dbLog.user_agent,
            createdAt: dbLog.created_at
        } );
    }

    // Log oluşturma
    static async create( {
        userId,
        action,
        entity,
        entityId,
        details,
        ipAddress,
        userAgent
    } ) {
        try {
            const { data, error } = await supabase
                .from( 'audit_logs' )
                .insert( {
                    user_id: userId,
                    action,
                    entity,
                    entity_id: entityId,
                    details,
                    ip_address: ipAddress,
                    user_agent: userAgent,
                    created_at: new Date()
                } )
                .select()
                .single();

            if ( error ) throw error;

            return this.fromDatabase( data );
        } catch ( error ) {
            console.error( 'Audit log oluşturulurken hata:', error );
            throw error;
        }
    }

    // Logları listele
    static async findAll( options = {} ) {
        try {
            let query = supabase
                .from( 'audit_logs' )
                .select( '*' );

            // Kullanıcıya göre filtreleme
            if ( options.userId ) {
                query = query.eq( 'user_id', options.userId );
            }

            // İşlem tipine göre filtreleme
            if ( options.action ) {
                query = query.eq( 'action', options.action );
            }

            // Entity tipine göre filtreleme
            if ( options.entity ) {
                query = query.eq( 'entity', options.entity );
            }

            // Tarih aralığına göre filtreleme
            if ( options.startDate ) {
                query = query.gte( 'created_at', options.startDate );
            }

            if ( options.endDate ) {
                query = query.lte( 'created_at', options.endDate );
            }

            // Sıralama
            query = query.order( 'created_at', { ascending: false } );

            // Sayfalama
            if ( options.limit ) {
                query = query.limit( options.limit );
            }

            if ( options.offset ) {
                query = query.range( options.offset, options.offset + ( options.limit || 10 ) - 1 );
            }

            const { data, error } = await query;

            if ( error ) throw error;

            return data.map( log => this.fromDatabase( log ) );
        } catch ( error ) {
            console.error( 'Audit logları listelenirken hata:', error );
            throw error;
        }
    }

    // ID'ye göre log bulma
    static async findById( id ) {
        try {
            const { data, error } = await supabase
                .from( 'audit_logs' )
                .select( '*' )
                .eq( 'id', id )
                .single();

            if ( error ) throw error;

            return data ? this.fromDatabase( data ) : null;
        } catch ( error ) {
            console.error( 'Audit log bulunurken hata:', error );
            throw error;
        }
    }

    // Kullanıcının loglarını getir
    static async findByUserId( userId, options = {} ) {
        try {
            let query = supabase
                .from( 'audit_logs' )
                .select( '*' )
                .eq( 'user_id', userId );

            // Tarih aralığına göre filtreleme
            if ( options.startDate ) {
                query = query.gte( 'created_at', options.startDate );
            }

            if ( options.endDate ) {
                query = query.lte( 'created_at', options.endDate );
            }

            // Sıralama
            query = query.order( 'created_at', { ascending: false } );

            // Sayfalama
            if ( options.limit ) {
                query = query.limit( options.limit );
            }

            if ( options.offset ) {
                query = query.range( options.offset, options.offset + ( options.limit || 10 ) - 1 );
            }

            const { data, error } = await query;

            if ( error ) throw error;

            return data.map( log => this.fromDatabase( log ) );
        } catch ( error ) {
            console.error( 'Kullanıcı logları alınırken hata:', error );
            throw error;
        }
    }
}

module.exports = AuditLog;
