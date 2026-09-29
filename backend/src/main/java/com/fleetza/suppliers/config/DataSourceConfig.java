package com.fleetza.suppliers.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;
import java.sql.Connection;
import java.sql.DriverManager;

@Configuration
public class DataSourceConfig {

    private static final Logger logger = LoggerFactory.getLogger(DataSourceConfig.class);

    @Value("${DB_URL:}")
    private String dbUrl;

    @Value("${MYSQL_URL:}")
    private String mysqlUrl;

    @Value("${MYSQL_PUBLIC_URL:}")
    private String mysqlPublicUrl;

    @Value("${MYSQLHOST:}")
    private String mysqlHost;

    @Value("${MYSQLPORT:}")
    private String mysqlPort;

    @Value("${MYSQLDATABASE:}")
    private String mysqlDatabase;

    @Value("${MYSQLUSER:}")
    private String mysqlUser;

    @Value("${MYSQLPASSWORD:}")
    private String mysqlPassword;

    @Value("${DB_HOST:localhost}")
    private String defaultHost;

    @Value("${DB_PORT:3306}")
    private String defaultPort;

    @Value("${DB_NAME:fleetza_suppliers}")
    private String defaultDatabase;

    @Value("${DB_USERNAME:root}")
    private String defaultUsername;

    @Value("${DB_PASSWORD:@bhishekSQL8755}")
    private String defaultPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        String targetHost = defaultHost;
        int targetPort = 3306;
        String targetDb = defaultDatabase;
        String targetUser = defaultUsername;
        String targetPass = defaultPassword;
        String resolvedJdbcUrl = null;

        String rawUrl = !mysqlUrl.isBlank() ? mysqlUrl : (!mysqlPublicUrl.isBlank() ? mysqlPublicUrl : dbUrl);

        if (rawUrl != null && !rawUrl.isBlank()) {
            try {
                if (rawUrl.startsWith("mysql://")) {
                    URI uri = new URI(rawUrl);
                    targetHost = uri.getHost() != null ? uri.getHost() : targetHost;
                    targetPort = uri.getPort() != -1 ? uri.getPort() : 3306;
                    String path = uri.getPath();
                    targetDb = (path != null && path.length() > 1) ? path.substring(1) : "railway";
                    if (uri.getUserInfo() != null && uri.getUserInfo().contains(":")) {
                        String[] parts = uri.getUserInfo().split(":", 2);
                        targetUser = parts[0];
                        targetPass = parts[1];
                    }
                } else if (rawUrl.startsWith("jdbc:mysql://")) {
                    resolvedJdbcUrl = rawUrl;
                    targetUser = !mysqlUser.isBlank() ? mysqlUser : defaultUsername;
                    targetPass = !mysqlPassword.isBlank() ? mysqlPassword : defaultPassword;
                }
            } catch (Exception e) {
                logger.warn("Could not parse raw database URL: {}", e.getMessage());
            }
        }

        if (resolvedJdbcUrl == null) {
            if (!mysqlHost.isBlank()) targetHost = mysqlHost;
            if (!mysqlPort.isBlank()) {
                try { targetPort = Integer.parseInt(mysqlPort); } catch (Exception ignored) {}
            }
            if (!mysqlDatabase.isBlank()) targetDb = mysqlDatabase;
            if (!mysqlUser.isBlank()) targetUser = mysqlUser;
            if (!mysqlPassword.isBlank()) targetPass = mysqlPassword;

            resolvedJdbcUrl = "jdbc:mysql://" + targetHost + ":" + targetPort + "/" + targetDb +
                    "?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Kolkata&createDatabaseIfNotExist=true&characterEncoding=UTF-8&connectTimeout=4000&socketTimeout=8000";
        }

        // Test if MySQL is actually reachable within 4 seconds
        boolean mysqlAvailable = false;
        try {
            DriverManager.setLoginTimeout(4);
            try (Connection conn = DriverManager.getConnection(resolvedJdbcUrl, targetUser, targetPass)) {
                mysqlAvailable = true;
                logger.info("Successfully connected to MySQL at {}:{} / database: {}", targetHost, targetPort, targetDb);
            }
        } catch (Exception ex) {
            logger.warn("MySQL database at {}:{} is not reachable ({}: {}).", targetHost, targetPort, ex.getClass().getSimpleName(), ex.getMessage());
        }

        HikariConfig config = new HikariConfig();
        config.setPoolName("FleetzaHikariPool");

        if (mysqlAvailable) {
            config.setDriverClassName("com.mysql.cj.jdbc.Driver");
            config.setJdbcUrl(resolvedJdbcUrl);
            config.setUsername(targetUser);
            config.setPassword(targetPass);
            config.setMaximumPoolSize(35);
            config.setMinimumIdle(5);
            config.setIdleTimeout(30000);
            config.setMaxLifetime(1800000);
            config.setConnectionTimeout(30000);
            return new HikariDataSource(config);
        } else {
            logger.warn("FALLING BACK TO RESILIENT IN-MEMORY DATABASE so application stays online without crashing!");
            config.setDriverClassName("org.h2.Driver");
            config.setJdbcUrl("jdbc:h2:mem:fleetza_db;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;MODE=MySQL");
            config.setUsername("sa");
            config.setPassword("");
            config.setMaximumPoolSize(20);
            config.setMinimumIdle(5);
            return new HikariDataSource(config);
        }
    }
}
