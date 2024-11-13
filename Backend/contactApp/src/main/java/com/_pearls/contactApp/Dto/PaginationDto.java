package com._pearls.contactApp.Dto;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class PaginationDto {
    List contact = new ArrayList();

    public int totalContacts;

    public int contactsPerPage;

    public int currentPage;

    public double totalPages;
}
