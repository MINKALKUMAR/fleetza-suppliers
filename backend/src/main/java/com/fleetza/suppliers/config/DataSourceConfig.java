package com.fleetza.suppliers.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
@Profile("mysql")
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
        HikariConfig config = new HikariConfig();
        config.setPoolName("FleetzaHikariPool");
        config.setDriverClassName("com.mysql.cj.jdbc.Driver");
        config.setMaximumPoolSize(35);
        config.setMinimumIdle(5);
        config.setIdleTimeout(30000);
        config.setMaxLifetime(1800000);
        config.setConnectionTimeout(30000);
        config.setLeakDetectionThreshold(60000);

        // Priority 1: Check MYSQL_URL or MYSQL_PUBLIC_URL (e.g. mysql://root:pass@host:port/db)
        String rawUrl = !mysqlUrl.isBlank() ? mysqlUrl : (!mysqlPublicUrl.isBlank() ? mysqlPublicUrl : dbUrl);

        if (rawUrl != null && !rawUrl.isBlank()) {
            try {
                if (rawUrl.startsWith("mysql://")) {
                    URI uri = new URI(rawUrl);
                    String host = uri.getHost();
                    int port = uri.getPort() != -1 ? uri.getPort() : 3306;
                    String path = uri.getPath();
                    String dbName = (path != null && path.length() > 1) ? path.substring(1) : "railway";
                    String jdbcUrl = "jdbc:mysql://" + host + ":" + port + "/" + dbName +
                            "?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Kolkata&createDatabaseIfNotExist=true&characterEncoding=UTF-8";

                    config.setJdbcUrl(jdbcUrl);
                    String userInfo = uri.getUserInfo();
                    if (userInfo != null && userInfo.contains(":")) {
                        String[] parts = userInfo.split(":", 2);
                        config.setUsername(parts[0]);
                        config.setPassword(parts[1]);
                    }
                    logger.info("Successfully configured DataSource from Railway URL for host: {}, database: {}", host, dbName);
                    return new HikariDataSource(config);
                } else if (rawUrl.startsWith("jdbc:mysql://")) {
                    config.setJdbcUrl(rawUrl);
                    config.setUsername(!mysqlUser.isBlank() ? mysqlUser : (!defaultUsername.isBlank() ? defaultUsername : "root"));
                    config.setPassword(!mysqlPassword.isBlank() ? mysqlPassword : defaultPassword);
                    return new HikariDataSource(config);
                }
            } catch (Exception e) {
                logger.warn("Could not parse raw URL, falling back to discrete parameters: {}", e.getMessage());
            }
        }

        // Priority 2: Use component variables (MYSQLHOST, MYSQLPORT, MYSQLDATABASE, etc.)
        String host = !mysqlHost.isBlank() ? mysqlHost : defaultHost;
        String port = !mysqlPort.isBlank() ? mysqlPort : defaultPort;
        String database = !mysqlDatabase.isBlank() ? mysqlDatabase : defaultDatabase;
        String username = !mysqlUser.isBlank() ? mysqlUser : defaultUsername;
        String password = !mysqlPassword.isBlank() ? mysqlPassword : defaultPassword;

        String jdbcUrl = "jdbc:mysql://" + host + ":" + port + "/" + database +
                "?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Kolkata&createDatabaseIfNotExist=true&characterEncoding=UTF-8";

        config.setJdbcUrl(jdbcUrl);
        config.setUsername(username);
        config.setPassword(password);

        logger.info("Configured DataSource for host: {}:{}, database: {}", host, port, database);
        return new HikariDataSource(config);
    }
}
