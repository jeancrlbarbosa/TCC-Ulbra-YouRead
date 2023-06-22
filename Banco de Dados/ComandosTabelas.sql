create database youread;

create table web_user
(
    codusu bigserial
        primary key,
    logusu varchar(40)              not null,
    pashas text                     not null,
    nomusu varchar(100)             not null,
    nomaut varchar(100),
    apanom char default 'N'::bpchar,
    monace char default 'N'::bpchar not null,
    tipusu char                     not null,
    emausu varchar(100)             not null,
    cnpjpf varchar(14),
    codrec text
);

create table web_requisita_monetizacao
(
    codusu bigint
        references web_user
            on delete cascade,
    motmon text not null,
    status varchar(6) default 'E'::character varying,
    datreq date       default CURRENT_DATE
);

create table web_generos
(
    codgen bigserial
        primary key,
    tagger varchar(50) not null,
    pubger char default 'S'::bpchar,
    codusu bigint
);

create table web_livros
(
    codliv bigserial
        primary key,
    codusu bigint                   not null
        references web_user
            on delete cascade,
    habmon char default 'N'::bpchar not null,
    titulo varchar(100)             not null,
    datcri date                     not null,
    desliv text,
    visliv char                     not null,
    bas64s text,
    tiparq varchar(6)
);

create table web_tag_livro
(
    codliv bigint not null
        references web_livros
            on delete cascade,
    codgen bigint not null
        references web_generos
            on delete cascade,
    primary key (codliv, codgen)
);

create table web_capitulos
(
    codcap bigserial
        primary key,
    numcap varchar(100) not null,
    ordcap integer      not null,
    codliv bigint       not null
        references web_livros
            on delete cascade,
    descap text,
    datatu date         not null,
    viscap char         not null
);

create table web_user_favoritos
(
    codliv bigint not null
        references web_livros
            on delete cascade,
    codusu bigint not null
        references web_user
            on delete cascade,
    primary key (codliv, codusu)
);

create table web_anuncios
(
    codanu bigserial
        primary key,
    codusu bigint       not null
        references web_user,
    prianu char         not null,
    desanu varchar(100) not null,
    status char
);

create table web_anuncio_arquivo
(
    codanu bigint     not null
        references web_anuncios
            on delete cascade,
    ladanu char(4)    not null,
    bas64s text       not null,
    tiparq varchar(6) not null,
    primary key (codanu, ladanu)
);

create table web_view_livros
(
    codusu   bigint    not null,
    codliv   bigint    not null,
    codcap   bigint    not null,
    datvie   timestamp not null,
    codanu_l bigint,
    codanu_r bigint
);

create table web_arquivos
(
    codcap bigint       not null
        references web_capitulos
            on delete cascade,
    bas64s text         not null,
    ordarq integer      not null,
    tiparq varchar(6)   not null,
    nomarq varchar(100) not null,
    primary key (codcap, ordarq)
);

