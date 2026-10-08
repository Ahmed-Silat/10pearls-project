package com._pearls.contactApp.Dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class PaginationDto<T> {

    private List<T> contacts;
    private long totalContacts;
    private int contactsPerPage;
    private int currentPage;
    private long totalPages;
}