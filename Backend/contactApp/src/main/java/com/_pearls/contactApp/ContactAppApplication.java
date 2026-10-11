package com._pearls.contactApp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class ContactAppApplication {

	public static void main(String[] args) {
		SpringApplication.run(ContactAppApplication.class, args);
	}
}